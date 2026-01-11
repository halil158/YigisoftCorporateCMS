using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Public page reading endpoints.
/// </summary>
public static class PublicPagesEndpoints
{
    public static IEndpointRouteBuilder MapPublicPagesEndpoints(this IEndpointRouteBuilder api)
    {
        // GET /api/pages/{slug} - Read published page by slug
        api.MapGet("/pages/{slug}", async (string slug, AppDbContext db) =>
        {
            Log.Information("Fetching page by slug: {Slug}", slug);

            var page = await db.Pages
                .AsNoTracking()
                .Where(p => p.Slug == slug && p.IsPublished)
                .FirstOrDefaultAsync();

            if (page is null)
            {
                Log.Information("Page not found or not published: {Slug}", slug);
                return Results.NotFound(new { error = "Page not found" });
            }

            var dto = new PageDto(
                page.Id,
                page.Slug,
                page.Title,
                page.MetaTitle,
                page.MetaDescription,
                page.Sections,
                page.IsPublished,
                page.CreatedAt,
                page.UpdatedAt
            );

            return Results.Ok(dto);
        });

        return api;
    }
}
