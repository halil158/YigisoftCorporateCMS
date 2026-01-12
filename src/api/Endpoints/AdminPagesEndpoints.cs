using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Validation.Sections;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin pages CRUD endpoints.
/// </summary>
public static class AdminPagesEndpoints
{
    // Slug validation regex: lowercase alphanumeric with hyphens
    private static readonly Regex SlugRegex = new(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    public static IEndpointRouteBuilder MapAdminPagesEndpoints(this IEndpointRouteBuilder admin)
    {
        // GET /api/admin/pages - List all pages
        admin.MapGet("/pages", async (AppDbContext db) =>
        {
            var pages = await db.Pages
                .AsNoTracking()
                .OrderByDescending(p => p.UpdatedAt)
                .Select(p => new PageAdminListItemDto(
                    p.Id,
                    p.Slug,
                    p.Title,
                    p.IsPublished,
                    p.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(pages);
        });

        // GET /api/admin/pages/{id:guid} - Get page by ID
        admin.MapGet("/pages/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var page = await db.Pages
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (page is null)
                return Results.NotFound(new { error = "Page not found" });

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

        // POST /api/admin/pages - Create page
        admin.MapPost("/pages", async (PageUpsertRequest request, AppDbContext db) =>
        {
            var (isValid, error, sectionErrors) = ValidatePageRequest(request);
            if (!isValid)
            {
                if (sectionErrors is not null)
                    return Results.BadRequest(new { error = "ValidationFailed", details = sectionErrors });
                return Results.BadRequest(new { error });
            }

            var slug = request.Slug.Trim().ToLowerInvariant();

            // Check slug uniqueness
            var slugExists = await db.Pages.AnyAsync(p => p.Slug == slug);
            if (slugExists)
            {
                Log.Warning("Page creation failed: slug conflict for {Slug}", slug);
                return Results.Conflict(new { error = "A page with this slug already exists", code = "slug_conflict" });
            }

            var page = new PageEntity
            {
                Slug = slug,
                Title = request.Title.Trim(),
                MetaTitle = request.MetaTitle?.Trim(),
                MetaDescription = request.MetaDescription?.Trim(),
                Sections = request.Sections,
                IsPublished = request.IsPublished,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Pages.Add(page);
            await db.SaveChangesAsync();

            Log.Information("Page created: {PageId} ({Slug})", page.Id, page.Slug);

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

            return Results.Created($"/api/admin/pages/{page.Id}", dto);
        });

        // PUT /api/admin/pages/{id:guid} - Update page
        admin.MapPut("/pages/{id:guid}", async (Guid id, PageUpsertRequest request, AppDbContext db) =>
        {
            var (isValid, error, sectionErrors) = ValidatePageRequest(request);
            if (!isValid)
            {
                if (sectionErrors is not null)
                    return Results.BadRequest(new { error = "ValidationFailed", details = sectionErrors });
                return Results.BadRequest(new { error });
            }

            var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
            if (page is null)
                return Results.NotFound(new { error = "Page not found" });

            var slug = request.Slug.Trim().ToLowerInvariant();

            // Check slug uniqueness (excluding current page)
            var slugExists = await db.Pages.AnyAsync(p => p.Slug == slug && p.Id != id);
            if (slugExists)
            {
                Log.Warning("Page update failed: slug conflict for {Slug} (PageId: {PageId})", slug, id);
                return Results.Conflict(new { error = "A page with this slug already exists", code = "slug_conflict" });
            }

            // Safety check: warn if sections are being cleared
            var existingSectionsEmpty = page.Sections == "[]" || string.IsNullOrWhiteSpace(page.Sections);
            var newSectionsEmpty = request.Sections == "[]";
            if (!existingSectionsEmpty && newSectionsEmpty)
            {
                Log.Warning(
                    "Page sections being cleared: {PageId} ({Slug}). Previous sections length: {Length}",
                    id, page.Slug, page.Sections.Length);
            }

            page.Slug = slug;
            page.Title = request.Title.Trim();
            page.MetaTitle = request.MetaTitle?.Trim();
            page.MetaDescription = request.MetaDescription?.Trim();
            page.Sections = request.Sections;
            page.IsPublished = request.IsPublished;
            page.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            Log.Information("Page updated: {PageId} ({Slug})", page.Id, page.Slug);

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

        // DELETE /api/admin/pages/{id:guid} - Delete page
        admin.MapDelete("/pages/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
            if (page is null)
                return Results.NotFound(new { error = "Page not found" });

            var slug = page.Slug;
            db.Pages.Remove(page);
            await db.SaveChangesAsync();

            Log.Information("Page deleted: {PageId} ({Slug})", id, slug);

            return Results.NoContent();
        });

        // POST /api/admin/pages/{id:guid}/publish - Publish page
        admin.MapPost("/pages/{id:guid}/publish", async (Guid id, AppDbContext db) =>
        {
            var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
            if (page is null)
                return Results.NotFound(new { error = "Page not found" });

            page.IsPublished = true;
            page.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            Log.Information("Page published: {PageId} ({Slug})", page.Id, page.Slug);

            return Results.Ok(new { id = page.Id, slug = page.Slug, isPublished = true });
        });

        // POST /api/admin/pages/{id:guid}/unpublish - Unpublish page
        admin.MapPost("/pages/{id:guid}/unpublish", async (Guid id, AppDbContext db) =>
        {
            var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
            if (page is null)
                return Results.NotFound(new { error = "Page not found" });

            page.IsPublished = false;
            page.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            Log.Information("Page unpublished: {PageId} ({Slug})", page.Id, page.Slug);

            return Results.Ok(new { id = page.Id, slug = page.Slug, isPublished = false });
        });

        return admin;
    }

    /// <summary>
    /// Validates page request. Returns (isValid, singleError, sectionErrors).
    /// </summary>
    private static (bool isValid, string? error, List<string>? sectionErrors) ValidatePageRequest(PageUpsertRequest request)
    {
        // Validate slug
        if (string.IsNullOrWhiteSpace(request.Slug))
            return (false, "Slug is required", null);

        var slug = request.Slug.Trim().ToLowerInvariant();
        if (!SlugRegex.IsMatch(slug))
            return (false, "Slug must be lowercase alphanumeric with hyphens (e.g., 'my-page-slug')", null);

        // Validate title
        if (string.IsNullOrWhiteSpace(request.Title))
            return (false, "Title is required", null);

        if (request.Title.Length > 200)
            return (false, "Title must be 200 characters or less", null);

        // Validate sections JSON
        if (string.IsNullOrWhiteSpace(request.Sections))
            return (false, "Sections is required", null);

        try
        {
            using var doc = JsonDocument.Parse(request.Sections);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return (false, "Sections must be a JSON array", null);
        }
        catch (JsonException)
        {
            return (false, "Sections must be valid JSON", null);
        }

        // Validate sections schema (type registry)
        var sectionErrors = SectionsValidator.Validate(request.Sections);
        if (sectionErrors.Count > 0)
            return (false, null, sectionErrors);

        return (true, null, null);
    }
}
