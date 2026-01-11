using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Admin contact message management endpoints.
/// </summary>
public static class AdminContactMessagesEndpoints
{
    public static IEndpointRouteBuilder MapAdminContactMessagesEndpoints(this IEndpointRouteBuilder admin)
    {
        // GET /api/admin/contact-messages - List contact messages
        admin.MapGet("/contact-messages", async (
            AppDbContext db,
            int? take) =>
        {
            var limit = Math.Clamp(take ?? 50, 1, 200);

            var messages = await db.ContactMessages
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .Select(m => new
                {
                    id = m.Id,
                    pageSlug = m.PageSlug,
                    recipientEmail = m.RecipientEmail,
                    createdAt = m.CreatedAt,
                    ip = m.Ip,
                    processedAt = m.ProcessedAt
                })
                .ToListAsync();

            return Results.Ok(messages);
        });

        // GET /api/admin/contact-messages/{id} - Get contact message by ID
        admin.MapGet("/contact-messages/{id:guid}", async (
            Guid id,
            AppDbContext db) =>
        {
            var message = await db.ContactMessages
                .AsNoTracking()
                .Where(m => m.Id == id)
                .Select(m => new
                {
                    id = m.Id,
                    pageSlug = m.PageSlug,
                    recipientEmail = m.RecipientEmail,
                    fields = m.Fields,
                    createdAt = m.CreatedAt,
                    ip = m.Ip,
                    userAgent = m.UserAgent,
                    processedAt = m.ProcessedAt
                })
                .FirstOrDefaultAsync();

            if (message is null)
            {
                return Results.NotFound(new { error = "NotFound", message = "Contact message not found" });
            }

            return Results.Ok(message);
        });

        // PATCH /api/admin/contact-messages/{id}/mark-processed - Mark message as processed
        admin.MapMethods("/contact-messages/{id:guid}/mark-processed", new[] { "PATCH" }, async (
            Guid id,
            AppDbContext db) =>
        {
            var message = await db.ContactMessages.FindAsync(id);

            if (message is null)
            {
                return Results.NotFound(new { error = "NotFound", message = "Contact message not found" });
            }

            message.ProcessedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            Log.Information("Marked contact message as processed: {Id}", id);

            return Results.Ok(new
            {
                id = message.Id,
                processedAt = message.ProcessedAt
            });
        });

        return admin;
    }
}
