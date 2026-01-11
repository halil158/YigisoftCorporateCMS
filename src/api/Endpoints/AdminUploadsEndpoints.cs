using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Serilog;
using YigisoftCorporateCMS.Api.Bootstrap;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Entities;
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
            var result = await uploadService.UploadAsync(file);

            if (result.IsSuccess && result.Data is not null)
            {
                // Get user ID from claims
                var userIdClaim = user.FindFirst("sub")?.Value
                    ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Guid? uploadedByUserId = Guid.TryParse(userIdClaim, out var uid) ? uid : null;

                // Create and save upload entity
                var entity = new UploadEntity
                {
                    StoragePath = result.Data.StoragePath,
                    Url = result.Data.Url,
                    FileName = result.Data.FileName,
                    OriginalFileName = result.Data.OriginalFileName,
                    ContentType = result.Data.ContentType,
                    Size = result.Data.Size,
                    UploadedByUserId = uploadedByUserId
                };

                db.Uploads.Add(entity);
                await db.SaveChangesAsync();

                return Results.Created(result.Data.Url, new
                {
                    id = entity.Id,
                    url = result.Data.Url,
                    fileName = result.Data.FileName,
                    originalFileName = result.Data.OriginalFileName,
                    contentType = result.Data.ContentType,
                    size = result.Data.Size
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
          .RequireRateLimiting(ApiServicesBootstrap.UploadRateLimitPolicy);

        // GET /api/admin/uploads - List uploads
        admin.MapGet("/uploads", async (
            AppDbContext db,
            int? take) =>
        {
            var limit = Math.Clamp(take ?? 50, 1, 200);

            var uploads = await db.Uploads
                .OrderByDescending(u => u.CreatedAt)
                .Take(limit)
                .Select(u => new
                {
                    id = u.Id,
                    url = u.Url,
                    fileName = u.FileName,
                    originalFileName = u.OriginalFileName,
                    contentType = u.ContentType,
                    size = u.Size,
                    createdAt = u.CreatedAt,
                    uploadedByUserId = u.UploadedByUserId
                })
                .ToListAsync();

            return Results.Ok(uploads);
        });

        // DELETE /api/admin/uploads/{id} - Delete an upload
        admin.MapDelete("/uploads/{id:guid}", async (
            Guid id,
            AppDbContext db,
            IOptions<UploadOptions> options) =>
        {
            var upload = await db.Uploads.FindAsync(id);

            if (upload is null)
            {
                return Results.NotFound(new { error = "NotFound", message = "Upload not found" });
            }

            // Try to delete file from disk
            var filePath = Path.Combine(options.Value.BaseUploadPath, upload.StoragePath);
            try
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    Log.Information("Deleted file: {FilePath}", filePath);
                }
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Failed to delete file: {FilePath}", filePath);
                // Continue to delete DB record even if file deletion fails
            }

            // Delete DB record
            db.Uploads.Remove(upload);
            await db.SaveChangesAsync();

            Log.Information("Deleted upload record: {UploadId}", id);

            return Results.NoContent();
        });

        return admin;
    }
}
