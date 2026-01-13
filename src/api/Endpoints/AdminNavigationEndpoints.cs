using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin navigation CRUD endpoints.
/// </summary>
public static class AdminNavigationEndpoints
{
    private static readonly Regex UrlRegex = new(@"^https?://", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly HashSet<string> ValidTypes = new() { "page", "external" };

    public static IEndpointRouteBuilder MapAdminNavigationEndpoints(this IEndpointRouteBuilder admin)
    {
        // GET /api/admin/navigation?key=main - Get navigation by key
        admin.MapGet("/navigation", async (string key, AppDbContext db) =>
        {
            Log.Information("Admin fetching navigation: {Key}", key);

            var navigation = await db.Navigations
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Key == key);

            if (navigation is null)
            {
                return Results.Ok(new NavigationDto(key, new List<NavigationItemDto>()));
            }

            var items = ParseNavigationItems(navigation.Data);
            return Results.Ok(new NavigationDto(key, items));
        });

        // PUT /api/admin/navigation?key=main - Upsert navigation
        admin.MapPut("/navigation", async (string key, NavigationUpsertRequest request, AppDbContext db) =>
        {
            Log.Information("Admin updating navigation: {Key}", key);

            // Validate request
            var errors = ValidateNavigationRequest(request);
            if (errors.Count > 0)
            {
                return Results.BadRequest(new { error = "ValidationFailed", details = errors });
            }

            // Build items JSON
            var itemsWithIds = request.Items.Select((item, index) => new
            {
                id = string.IsNullOrEmpty(item.Id) ? Guid.NewGuid().ToString() : item.Id,
                label = item.Label.Trim(),
                type = item.Type,
                slug = item.Type == "page" ? item.Slug?.Trim() : null,
                url = item.Type == "external" ? item.Url?.Trim() : null,
                order = item.Order,
                isVisible = item.IsVisible,
                newTab = item.Type == "external" ? item.NewTab : null
            }).ToList();

            var dataJson = JsonSerializer.Serialize(itemsWithIds);

            // Find existing or create new
            var navigation = await db.Navigations.FirstOrDefaultAsync(n => n.Key == key);

            if (navigation is null)
            {
                navigation = new NavigationEntity
                {
                    Key = key,
                    Data = dataJson,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Navigations.Add(navigation);
                Log.Information("Creating new navigation: {Key}", key);
            }
            else
            {
                navigation.Data = dataJson;
                navigation.UpdatedAt = DateTime.UtcNow;
                Log.Information("Updating existing navigation: {Key}", key);
            }

            await db.SaveChangesAsync();

            var items = ParseNavigationItems(navigation.Data);
            return Results.Ok(new NavigationDto(key, items));
        });

        return admin;
    }

    private static List<string> ValidateNavigationRequest(NavigationUpsertRequest request)
    {
        var errors = new List<string>();

        if (request.Items is null)
        {
            errors.Add("items is required");
            return errors;
        }

        for (int i = 0; i < request.Items.Count; i++)
        {
            var item = request.Items[i];
            var prefix = $"items[{i}]";

            // Label required
            if (string.IsNullOrWhiteSpace(item.Label))
            {
                errors.Add($"{prefix}.label is required");
            }

            // Type validation
            if (string.IsNullOrWhiteSpace(item.Type))
            {
                errors.Add($"{prefix}.type is required");
            }
            else if (!ValidTypes.Contains(item.Type))
            {
                errors.Add($"{prefix}.type must be 'page' or 'external'");
            }
            else
            {
                // Type-specific validation
                if (item.Type == "page")
                {
                    if (string.IsNullOrWhiteSpace(item.Slug))
                    {
                        errors.Add($"{prefix}.slug is required for type 'page'");
                    }
                }
                else if (item.Type == "external")
                {
                    if (string.IsNullOrWhiteSpace(item.Url))
                    {
                        errors.Add($"{prefix}.url is required for type 'external'");
                    }
                    else if (!UrlRegex.IsMatch(item.Url))
                    {
                        errors.Add($"{prefix}.url must start with http:// or https://");
                    }
                }
            }
        }

        return errors;
    }

    private static List<NavigationItemDto> ParseNavigationItems(string dataJson)
    {
        var items = new List<NavigationItemDto>();

        try
        {
            using var doc = JsonDocument.Parse(dataJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return items;

            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var id = element.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
                var label = element.TryGetProperty("label", out var labelProp) ? labelProp.GetString() ?? "" : "";
                var type = element.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "" : "";
                var slug = element.TryGetProperty("slug", out var slugProp) ? slugProp.GetString() : null;
                var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
                var order = element.TryGetProperty("order", out var orderProp) && orderProp.ValueKind == JsonValueKind.Number ? orderProp.GetInt32() : 0;
                var isVisible = element.TryGetProperty("isVisible", out var visibleProp) && visibleProp.ValueKind == JsonValueKind.True;
                var newTab = element.TryGetProperty("newTab", out var newTabProp) && newTabProp.ValueKind != JsonValueKind.Null ? newTabProp.GetBoolean() : (bool?)null;

                items.Add(new NavigationItemDto(id, label, type, slug, url, order, isVisible, newTab));
            }
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Failed to parse navigation data JSON");
        }

        return items;
    }
}
