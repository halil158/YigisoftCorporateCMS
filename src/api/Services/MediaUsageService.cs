using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Services;

/// <summary>
/// Service for checking media usage across the CMS.
/// Scans pages, navigation, and settings for references to media assets.
/// </summary>
public class MediaUsageService
{
    private readonly AppDbContext _db;

    public MediaUsageService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Checks if a media file is being used anywhere in the CMS.
    /// </summary>
    /// <param name="mediaId">The ID of the media file to check.</param>
    /// <returns>Media usage information including pages, navigation, and settings.</returns>
    public async Task<MediaUsageInfo> GetUsageAsync(Guid mediaId)
    {
        var upload = await _db.Uploads.FindAsync(mediaId);
        if (upload is null)
        {
            Log.Debug("Media {MediaId} not found when checking usage", mediaId);
            return new MediaUsageInfo(mediaId, [], [], []);
        }

        Log.Debug("Checking usage for media {MediaId} with URL {Url}", mediaId, upload.Url);

        var pageUsages = await GetPageUsagesAsync(upload);
        var navigationUsages = await GetNavigationUsagesAsync(upload);
        var settingsUsages = await GetSettingsUsagesAsync(mediaId);

        var result = new MediaUsageInfo(mediaId, pageUsages, navigationUsages, settingsUsages);

        Log.Debug("Media {MediaId} usage: {Total} total (pages={Pages}, nav={Nav}, settings={Settings})",
            mediaId, result.Total, pageUsages.Count, navigationUsages.Count, settingsUsages.Count);

        return result;
    }

    /// <summary>
    /// Gets usage count for a media file (faster than full usage details).
    /// </summary>
    public async Task<int> GetUsageCountAsync(Guid mediaId)
    {
        var upload = await _db.Uploads.FindAsync(mediaId);
        if (upload is null) return 0;

        var mediaIdString = mediaId.ToString();

        // Count pages containing the URL
        var pageCount = await _db.Pages
            .Where(p => EF.Functions.ILike(p.Sections, $"%{upload.Url}%") ||
                       (upload.ThumbnailUrl != null && EF.Functions.ILike(p.Sections, $"%{upload.ThumbnailUrl}%")))
            .CountAsync();

        // Count navigation entries containing the URL
        var navCount = await _db.Navigations
            .Where(n => EF.Functions.ILike(n.Data, $"%{upload.Url}%") ||
                       (upload.ThumbnailUrl != null && EF.Functions.ILike(n.Data, $"%{upload.ThumbnailUrl}%")))
            .CountAsync();

        // Count settings containing the media ID
        var settingsCount = await _db.Settings
            .Where(s => EF.Functions.ILike(s.Data, $"%{mediaIdString}%"))
            .CountAsync();

        return pageCount + navCount + settingsCount;
    }

    /// <summary>
    /// Scans all pages for references to the media URL in sections JSON.
    /// </summary>
    private async Task<List<PageMediaUsage>> GetPageUsagesAsync(UploadEntity upload)
    {
        var usages = new List<PageMediaUsage>();

        var pages = await _db.Pages
            .Where(p => EF.Functions.ILike(p.Sections, $"%{upload.Url}%") ||
                       (upload.ThumbnailUrl != null && EF.Functions.ILike(p.Sections, $"%{upload.ThumbnailUrl}%")))
            .Select(p => new { p.Id, p.Slug, p.Title, p.Sections })
            .ToListAsync();

        foreach (var page in pages)
        {
            var paths = FindUrlPathsInJson(page.Sections, upload.Url, upload.ThumbnailUrl);
            foreach (var path in paths)
            {
                usages.Add(new PageMediaUsage(page.Id, page.Slug, page.Title, path));
            }
        }

        return usages;
    }

    /// <summary>
    /// Scans all navigation entries for references to the media URL in data JSON.
    /// </summary>
    private async Task<List<NavigationMediaUsage>> GetNavigationUsagesAsync(UploadEntity upload)
    {
        var usages = new List<NavigationMediaUsage>();

        var navigations = await _db.Navigations
            .Where(n => EF.Functions.ILike(n.Data, $"%{upload.Url}%") ||
                       (upload.ThumbnailUrl != null && EF.Functions.ILike(n.Data, $"%{upload.ThumbnailUrl}%")))
            .Select(n => new { n.Key, n.Data })
            .ToListAsync();

        foreach (var nav in navigations)
        {
            var paths = FindUrlPathsInJson(nav.Data, upload.Url, upload.ThumbnailUrl);
            foreach (var path in paths)
            {
                usages.Add(new NavigationMediaUsage(nav.Key, path));
            }
        }

        return usages;
    }

    /// <summary>
    /// Scans settings for references to the media ID in JSONB data.
    /// Settings store media IDs (GUIDs) rather than URLs.
    /// </summary>
    private async Task<List<SettingsMediaUsage>> GetSettingsUsagesAsync(Guid mediaId)
    {
        var usages = new List<SettingsMediaUsage>();
        var mediaIdString = mediaId.ToString();

        var settings = await _db.Settings
            .Where(s => EF.Functions.ILike(s.Data, $"%{mediaIdString}%"))
            .Select(s => new { s.Key, s.Data })
            .ToListAsync();

        foreach (var setting in settings)
        {
            var paths = FindGuidPathsInJson(setting.Data, mediaIdString);
            foreach (var path in paths)
            {
                usages.Add(new SettingsMediaUsage(setting.Key, path));
            }
        }

        return usages;
    }

    /// <summary>
    /// Finds JSON paths that contain the specified URL.
    /// </summary>
    private static List<string> FindUrlPathsInJson(string json, string url, string? thumbnailUrl)
    {
        var paths = new List<string>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            FindUrlPathsRecursive(doc.RootElement, "$", url, thumbnailUrl, paths);
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Failed to parse JSON when searching for media URL");
        }

        return paths;
    }

    private static void FindUrlPathsRecursive(
        JsonElement element,
        string currentPath,
        string url,
        string? thumbnailUrl,
        List<string> paths)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var newPath = $"{currentPath}.{property.Name}";
                    FindUrlPathsRecursive(property.Value, newPath, url, thumbnailUrl, paths);
                }
                break;

            case JsonValueKind.Array:
                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    var newPath = $"{currentPath}[{index}]";
                    FindUrlPathsRecursive(item, newPath, url, thumbnailUrl, paths);
                    index++;
                }
                break;

            case JsonValueKind.String:
                var value = element.GetString();
                if (value != null)
                {
                    if (value.Contains(url, StringComparison.OrdinalIgnoreCase))
                    {
                        paths.Add(currentPath);
                    }
                    else if (thumbnailUrl != null && value.Contains(thumbnailUrl, StringComparison.OrdinalIgnoreCase))
                    {
                        paths.Add(currentPath);
                    }
                }
                break;
        }
    }

    /// <summary>
    /// Finds JSON paths that contain the specified GUID.
    /// </summary>
    private static List<string> FindGuidPathsInJson(string json, string guidString)
    {
        var paths = new List<string>();

        try
        {
            using var doc = JsonDocument.Parse(json);
            FindGuidPathsRecursive(doc.RootElement, "$", guidString, paths);
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Failed to parse JSON when searching for media GUID");
        }

        return paths;
    }

    private static void FindGuidPathsRecursive(
        JsonElement element,
        string currentPath,
        string guidString,
        List<string> paths)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var newPath = $"{currentPath}.{property.Name}";
                    FindGuidPathsRecursive(property.Value, newPath, guidString, paths);
                }
                break;

            case JsonValueKind.Array:
                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    var newPath = $"{currentPath}[{index}]";
                    FindGuidPathsRecursive(item, newPath, guidString, paths);
                    index++;
                }
                break;

            case JsonValueKind.String:
                var value = element.GetString();
                if (value != null && value.Equals(guidString, StringComparison.OrdinalIgnoreCase))
                {
                    paths.Add(currentPath);
                }
                break;
        }
    }
}
