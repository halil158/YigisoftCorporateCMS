using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Services;

/// <summary>
/// Service for checking media usage across the CMS.
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
    /// <returns>Media usage information.</returns>
    public async Task<MediaUsageInfo> GetUsageAsync(Guid mediaId)
    {
        var upload = await _db.Uploads.FindAsync(mediaId);
        if (upload is null)
        {
            return new MediaUsageInfo([], []);
        }

        var pageUsages = await GetPageUsagesAsync(upload);
        var settingsUsages = await GetSettingsUsagesAsync(mediaId);

        return new MediaUsageInfo(pageUsages, settingsUsages);
    }

    /// <summary>
    /// Scans all pages for references to the media URL in sections JSON.
    /// </summary>
    private async Task<List<PageMediaUsage>> GetPageUsagesAsync(UploadEntity upload)
    {
        var usages = new List<PageMediaUsage>();

        // Get all pages that might contain the URL in their sections
        // We use EF.Functions.Like or raw string search since JSON contains is complex
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
    /// Scans settings for references to the media ID in JSONB data.
    /// </summary>
    private async Task<List<SettingsMediaUsage>> GetSettingsUsagesAsync(Guid mediaId)
    {
        var usages = new List<SettingsMediaUsage>();
        var mediaIdString = mediaId.ToString();

        // Get settings that contain the media ID
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
            FindUrlPathsRecursive(doc.RootElement, "", url, thumbnailUrl, paths);
        }
        catch
        {
            // If JSON parsing fails, return empty
        }

        return paths;
    }

    private static void FindUrlPathsRecursive(JsonElement element, string currentPath, string url, string? thumbnailUrl, List<string> paths)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var newPath = string.IsNullOrEmpty(currentPath)
                        ? property.Name
                        : $"{currentPath}.{property.Name}";
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
            FindGuidPathsRecursive(doc.RootElement, "", guidString, paths);
        }
        catch
        {
            // If JSON parsing fails, return empty
        }

        return paths;
    }

    private static void FindGuidPathsRecursive(JsonElement element, string currentPath, string guidString, List<string> paths)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    var newPath = string.IsNullOrEmpty(currentPath)
                        ? property.Name
                        : $"{currentPath}.{property.Name}";
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
