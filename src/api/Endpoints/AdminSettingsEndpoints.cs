using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Validation.Settings;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin settings CRUD endpoints.
/// </summary>
public static class AdminSettingsEndpoints
{
    public static IEndpointRouteBuilder MapAdminSettingsEndpoints(this IEndpointRouteBuilder admin)
    {
        // GET /api/admin/settings - List all settings
        admin.MapGet("/settings", async (AppDbContext db) =>
        {
            Log.Information("Admin fetching all settings");

            var settings = await db.Settings
                .AsNoTracking()
                .OrderBy(s => s.Key)
                .ToListAsync();

            var result = settings.Select(s => new SettingsDto(
                s.Key,
                ParseJsonData(s.Data),
                s.UpdatedAt
            )).ToList();

            return Results.Ok(result);
        });

        // GET /api/admin/settings/{key} - Get settings by key
        admin.MapGet("/settings/{key}", async (string key, AppDbContext db) =>
        {
            Log.Information("Admin fetching settings: {Key}", key);

            if (!SettingsValidator.ValidKeys.Contains(key))
            {
                return Results.BadRequest(new { error = $"Invalid settings key '{key}'. Valid keys: {string.Join(", ", SettingsValidator.ValidKeys)}" });
            }

            var settings = await db.Settings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == key);

            if (settings is null)
            {
                // Return empty object for missing settings
                return Results.Ok(new SettingsDto(key, JsonDocument.Parse("{}").RootElement, DateTime.UtcNow));
            }

            return Results.Ok(new SettingsDto(
                settings.Key,
                ParseJsonData(settings.Data),
                settings.UpdatedAt
            ));
        });

        // PUT /api/admin/settings/{key} - Upsert settings by key
        admin.MapPut("/settings/{key}", async (string key, SettingsUpsertRequest request, AppDbContext db) =>
        {
            Log.Information("Admin updating settings: {Key}", key);

            // Validate key
            if (!SettingsValidator.ValidKeys.Contains(key))
            {
                return Results.BadRequest(new { error = $"Invalid settings key '{key}'. Valid keys: {string.Join(", ", SettingsValidator.ValidKeys)}" });
            }

            // Gather valid media IDs for branding validation
            HashSet<Guid>? validMediaIds = null;
            if (key == "site.branding")
            {
                validMediaIds = (await db.Uploads
                    .AsNoTracking()
                    .Select(u => u.Id)
                    .ToListAsync())
                    .ToHashSet();
            }

            // Validate request data
            var errors = SettingsValidator.Validate(key, request.Data, validMediaIds);
            if (errors.Count > 0)
            {
                return Results.BadRequest(new { error = "ValidationFailed", details = errors });
            }

            // Serialize data to JSON string
            var dataJson = JsonSerializer.Serialize(request.Data);

            // Find existing or create new
            var settings = await db.Settings.FirstOrDefaultAsync(s => s.Key == key);

            if (settings is null)
            {
                settings = new SettingsEntity
                {
                    Key = key,
                    Data = dataJson,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Settings.Add(settings);
                Log.Information("Creating new settings: {Key}", key);
            }
            else
            {
                settings.Data = dataJson;
                settings.UpdatedAt = DateTime.UtcNow;
                Log.Information("Updating existing settings: {Key}", key);
            }

            await db.SaveChangesAsync();

            return Results.Ok(new SettingsDto(
                settings.Key,
                ParseJsonData(settings.Data),
                settings.UpdatedAt
            ));
        });

        return admin;
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
}
