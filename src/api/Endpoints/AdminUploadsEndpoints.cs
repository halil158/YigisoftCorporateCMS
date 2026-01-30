using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using YigisoftCorporateCMS.Api.Extensions;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Services;
using YigisoftCorporateCMS.Api.Uploads;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin file upload endpoints.
/// </summary>
public static class AdminUploadsEndpoints
{
    public static IEndpointRouteBuilder MapAdminUploadsEndpoints(this IEndpointRouteBuilder admin)
    {
        // POST /api/admin/uploads - Upload a file (rate limited: 30/min per IP)
        admin.MapPost("/uploads", async (
            IFormFile? file,
            IUploadService uploadService,
            AppDbContext db,
            ClaimsPrincipal user) =>
        {
            // Generate ID upfront for deterministic thumbnail naming
            var uploadId = Guid.NewGuid();

            var result = await uploadService.UploadAsync(uploadId, file);

            if (result.IsSuccess && result.Data is not null)
            {
                // Get user ID from claims
                var userIdClaim = user.FindFirst("sub")?.Value
                    ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Guid? uploadedByUserId = Guid.TryParse(userIdClaim, out var uid) ? uid : null;

                // Create and save upload entity
                var entity = new UploadEntity
                {
                    Id = uploadId,
                    StoragePath = result.Data.StoragePath,
                    Url = result.Data.Url,
                    FileName = result.Data.FileName,
                    OriginalFileName = result.Data.OriginalFileName,
                    ContentType = result.Data.ContentType,
                    Size = result.Data.Size,
                    UploadedByUserId = uploadedByUserId,
                    ThumbnailStoragePath = result.Data.ThumbnailStoragePath,
                    ThumbnailUrl = result.Data.ThumbnailUrl,
                    Width = result.Data.Width,
                    Height = result.Data.Height
                };

                db.Uploads.Add(entity);
                await db.SaveChangesAsync();

                Log.Information("Uploaded new media {MediaId}: {FileName}", uploadId, result.Data.OriginalFileName);

                return Results.Created(result.Data.Url, new
                {
                    id = entity.Id,
                    url = result.Data.Url,
                    thumbnailUrl = result.Data.ThumbnailUrl,
                    fileName = result.Data.FileName,
                    originalFileName = result.Data.OriginalFileName,
                    contentType = result.Data.ContentType,
                    size = result.Data.Size,
                    width = result.Data.Width,
                    height = result.Data.Height
                });
            }

            if (result.IsServerError)
            {
                return Results.Problem(
                    detail: "An error occurred while uploading the file",
                    statusCode: 500
                );
            }

            return Results.BadRequest(new { error = "ValidationFailed", details = result.Errors });
        }).DisableAntiforgery()
          .RequireRateLimiting(ServiceCollectionExtensions.UploadRateLimitPolicy);

        // GET /api/admin/uploads - List uploads with usage counts
        admin.MapGet("/uploads", async (
            AppDbContext db,
            MediaUsageService mediaUsageService,
            int? take,
            bool includeUsage = true) =>
        {
            var limit = Math.Clamp(take ?? 50, 1, 200);

            var uploads = await db.Uploads
                .OrderByDescending(u => u.CreatedAt)
                .Take(limit)
                .Select(u => new
                {
                    u.Id,
                    u.Url,
                    u.ThumbnailUrl,
                    u.FileName,
                    u.OriginalFileName,
                    u.ContentType,
                    u.Size,
                    u.Width,
                    u.Height,
                    u.CreatedAt,
                    u.UploadedByUserId
                })
                .ToListAsync();

            // If usage counts requested, fetch them
            if (includeUsage)
            {
                var result = new List<object>();
                foreach (var upload in uploads)
                {
                    var usageCount = await mediaUsageService.GetUsageCountAsync(upload.Id);
                    result.Add(new
                    {
                        id = upload.Id,
                        url = upload.Url,
                        thumbnailUrl = upload.ThumbnailUrl,
                        fileName = upload.FileName,
                        originalFileName = upload.OriginalFileName,
                        contentType = upload.ContentType,
                        size = upload.Size,
                        width = upload.Width,
                        height = upload.Height,
                        createdAt = upload.CreatedAt,
                        uploadedByUserId = upload.UploadedByUserId,
                        usageCount = usageCount
                    });
                }
                return Results.Ok(result);
            }

            // Return without usage counts
            return Results.Ok(uploads.Select(u => new
            {
                id = u.Id,
                url = u.Url,
                thumbnailUrl = u.ThumbnailUrl,
                fileName = u.FileName,
                originalFileName = u.OriginalFileName,
                contentType = u.ContentType,
                size = u.Size,
                width = u.Width,
                height = u.Height,
                createdAt = u.CreatedAt,
                uploadedByUserId = u.UploadedByUserId
            }));
        });

        // GET /api/admin/uploads/{id}/usage - Get detailed media usage information
        admin.MapGet("/uploads/{id:guid}/usage", async (
            Guid id,
            MediaUsageService mediaUsageService,
            AppDbContext db) =>
        {
            var upload = await db.Uploads.FindAsync(id);
            if (upload is null)
            {
                return Results.NotFound(new { error = "NotFound", message = "Upload not found" });
            }

            var usage = await mediaUsageService.GetUsageAsync(id);
            return Results.Ok(usage);
        });

        // DELETE /api/admin/uploads/{id} - Delete an upload (blocked if in use)
        admin.MapDelete("/uploads/{id:guid}", async (
            Guid id,
            AppDbContext db,
            MediaUsageService mediaUsageService,
            IOptions<UploadOptions> options) =>
        {
            var upload = await db.Uploads.FindAsync(id);

            if (upload is null)
            {
                return Results.NotFound(new { error = "NotFound", message = "Upload not found" });
            }

            // Check if media is in use
            var usage = await mediaUsageService.GetUsageAsync(id);
            if (usage.IsInUse)
            {
                Log.Warning("Blocked deletion of media {MediaId} - in use by {Total} resources (pages={Pages}, nav={Nav}, settings={Settings})",
                    id, usage.Total, usage.Pages.Count, usage.Navigation.Count, usage.Settings.Count);
                return Results.Conflict(new MediaInUseError("MEDIA_IN_USE", usage));
            }

            // Try to delete main file from disk
            var filePath = Path.Combine(options.Value.BaseUploadPath, upload.StoragePath);
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    Log.Information("Deleted file from disk: {FilePath}", filePath);
                }
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Failed to delete file from disk: {FilePath}", filePath);
                // Continue to delete DB record even if file deletion fails
            }

            // Try to delete thumbnail if exists
            if (!string.IsNullOrEmpty(upload.ThumbnailStoragePath))
            {
                var thumbPath = Path.Combine(options.Value.BaseUploadPath, upload.ThumbnailStoragePath);
                try
                {
                    if (File.Exists(thumbPath))
                    {
                        File.Delete(thumbPath);
                        Log.Information("Deleted thumbnail from disk: {ThumbPath}", thumbPath);
                    }
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Failed to delete thumbnail from disk: {ThumbPath}", thumbPath);
                }
            }

            // Delete DB record
            db.Uploads.Remove(upload);
            await db.SaveChangesAsync();

            Log.Information("Deleted media {MediaId}: {FileName}", id, upload.OriginalFileName);

            return Results.NoContent();
        });

        return admin;
    }
}
