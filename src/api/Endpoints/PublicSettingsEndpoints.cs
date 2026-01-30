using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Validation.Settings;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Public settings endpoints.
/// </summary>
public static class PublicSettingsEndpoints
{
    public static IEndpointRouteBuilder MapPublicSettingsEndpoints(this IEndpointRouteBuilder api)
    {
        // GET /api/public/settings/{key} - Get settings by key
        api.MapGet("/public/settings/{key}", async (string key, AppDbContext db) =>
        {
            Log.Debug("Fetching public settings: {Key}", key);

            if (!SettingsValidator.ValidKeys.Contains(key))
            {
                return Results.BadRequest(new { error = $"Invalid settings key '{key}'" });
            }

            var settings = await db.Settings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == key);

            // Always return 200 with empty/default data if not found
            if (settings is null)
            {
                Log.Debug("Settings not found, returning empty: {Key}", key);
                return Results.Ok(new SettingsDto(key, JsonDocument.Parse("{}").RootElement, DateTime.UtcNow));
            }

            return Results.Ok(new SettingsDto(
                settings.Key,
                ParseJsonData(settings.Data),
                settings.UpdatedAt
            ));
        });

        // GET /api/public/settings/{key}/resolved - Get branding with resolved media URLs
        api.MapGet("/public/settings/{key}/resolved", async (string key, AppDbContext db) =>
        {
            Log.Debug("Fetching public resolved settings: {Key}", key);

            if (key != "site.branding")
            {
                return Results.BadRequest(new { error = "Resolved endpoint only available for 'site.branding'" });
            }

            var settings = await db.Settings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == key);

            if (settings is null)
            {
                // Return default branding
                return Results.Ok(new
                {
                    siteName = (string?)null,
                    logoLightUrl = (string?)null,
                    logoDarkUrl = (string?)null,
                    faviconUrl = (string?)null,
                    appleTouchIconUrl = (string?)null,
                    defaultOgImageUrl = (string?)null
                });
            }

            try
            {
                var data = JsonDocument.Parse(settings.Data).RootElement;

                // Extract media IDs
                var logoLightId = GetGuidProperty(data, "logoLight");
                var logoDarkId = GetGuidProperty(data, "logoDark");
                var faviconId = GetGuidProperty(data, "favicon");
                var appleTouchIconId = GetGuidProperty(data, "appleTouchIcon");
                var defaultOgImageId = GetGuidProperty(data, "defaultOgImage");

                // Collect all IDs to fetch
                var mediaIds = new List<Guid>();
                if (logoLightId.HasValue) mediaIds.Add(logoLightId.Value);
                if (logoDarkId.HasValue) mediaIds.Add(logoDarkId.Value);
                if (faviconId.HasValue) mediaIds.Add(faviconId.Value);
                if (appleTouchIconId.HasValue) mediaIds.Add(appleTouchIconId.Value);
                if (defaultOgImageId.HasValue) mediaIds.Add(defaultOgImageId.Value);

                // Fetch URLs from uploads table
                var uploads = await db.Uploads
                    .AsNoTracking()
                    .Where(u => mediaIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.Url })
                    .ToDictionaryAsync(u => u.Id, u => u.Url);

                return Results.Ok(new
                {
                    siteName = GetStringProperty(data, "siteName"),
                    logoLightUrl = logoLightId.HasValue && uploads.TryGetValue(logoLightId.Value, out var l1) ? l1 : null,
                    logoDarkUrl = logoDarkId.HasValue && uploads.TryGetValue(logoDarkId.Value, out var l2) ? l2 : null,
                    faviconUrl = faviconId.HasValue && uploads.TryGetValue(faviconId.Value, out var l3) ? l3 : null,
                    appleTouchIconUrl = appleTouchIconId.HasValue && uploads.TryGetValue(appleTouchIconId.Value, out var l4) ? l4 : null,
                    defaultOgImageUrl = defaultOgImageId.HasValue && uploads.TryGetValue(defaultOgImageId.Value, out var l5) ? l5 : null
                });
            }
            catch (JsonException ex)
            {
                Log.Warning(ex, "Failed to parse branding settings JSON");
                return Results.Ok(new
                {
                    siteName = (string?)null,
                    logoLightUrl = (string?)null,
                    logoDarkUrl = (string?)null,
                    faviconUrl = (string?)null,
                    appleTouchIconUrl = (string?)null,
                    defaultOgImageUrl = (string?)null
                });
            }
        });

        return api;
    }

    private static JsonElement ParseJsonData(string dataJson)
    {
        try
        {
            return JsonDocument.Parse(dataJson).RootElement;
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Failed to parse settings data JSON");
            return JsonDocument.Parse("{}").RootElement;
        }
    }

    private static string? GetStringProperty(JsonElement element, string name)
    {
        if (element.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString();
        }
        return null;
    }

    private static Guid? GetGuidProperty(JsonElement element, string name)
    {
        if (element.TryGetProperty(name, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            if (Guid.TryParse(prop.GetString(), out var guid))
            {
                return guid;
            }
        }
        return null;
    }
}
