using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Public navigation endpoints.
/// </summary>
public static class PublicNavigationEndpoints
{
    public static IEndpointRouteBuilder MapPublicNavigationEndpoints(this IEndpointRouteBuilder api)
    {
        // GET /api/public/navigation?key=main - Get navigation by key
        api.MapGet("/public/navigation", async (string key, AppDbContext db) =>
        {
            Log.Information("Fetching public navigation: {Key}", key);

            var navigation = await db.Navigations
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Key == key);

            // Always return 200 with empty items if not found (so public web doesn't break)
            if (navigation is null)
            {
                Log.Information("Navigation not found, returning empty: {Key}", key);
                return Results.Ok(new NavigationDto(key, new List<NavigationItemDto>()));
            }

            // Parse items from JSON
            var items = ParseNavigationItems(navigation.Data);

            return Results.Ok(new NavigationDto(key, items));
        });

        return api;
    }

    private static List<NavigationItemDto> ParseNavigationItems(string dataJson)
    {
        var items = new List<NavigationItemDto>();

        try
        {
            using var doc = JsonDocument.Parse(dataJson);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return items;

            items = ParseItemsFromJson(doc.RootElement);
        }
        catch (JsonException ex)
        {
            Log.Warning(ex, "Failed to parse navigation data JSON");
        }

        // Sort items by order
        return items.OrderBy(i => i.Order).ToList();
    }

    private static List<NavigationItemDto> ParseItemsFromJson(JsonElement array)
    {
        var items = new List<NavigationItemDto>();

        foreach (var element in array.EnumerateArray())
        {
            var id = element.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? "" : "";
            var label = element.TryGetProperty("label", out var labelProp) ? labelProp.GetString() ?? "" : "";
            var type = element.TryGetProperty("type", out var typeProp) ? typeProp.GetString() ?? "" : "";
            var slug = element.TryGetProperty("slug", out var slugProp) ? slugProp.GetString() : null;
            var url = element.TryGetProperty("url", out var urlProp) ? urlProp.GetString() : null;
            var order = element.TryGetProperty("order", out var orderProp) && orderProp.ValueKind == JsonValueKind.Number ? orderProp.GetInt32() : 0;
            var isVisible = element.TryGetProperty("isVisible", out var visibleProp) && visibleProp.ValueKind == JsonValueKind.True;
            var newTab = element.TryGetProperty("newTab", out var newTabProp) && newTabProp.ValueKind != JsonValueKind.Null ? newTabProp.GetBoolean() : (bool?)null;

            // Parse children recursively
            var children = new List<NavigationItemDto>();
            if (element.TryGetProperty("children", out var childrenProp) && childrenProp.ValueKind == JsonValueKind.Array)
            {
                children = ParseItemsFromJson(childrenProp);
            }

            // Sort children by order
            children = children.OrderBy(c => c.Order).ToList();

            items.Add(new NavigationItemDto(id, label, type, slug, url, order, isVisible, newTab, children));
        }

        return items;
    }
}
