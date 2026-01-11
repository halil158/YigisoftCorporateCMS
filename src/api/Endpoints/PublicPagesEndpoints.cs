using System.Text.Json;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Extensions;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Public page reading endpoints.
/// </summary>
public static class PublicPagesEndpoints
{
    private static readonly HashSet<string> AllowedFieldTypes = new() { "text", "email", "textarea", "phone" };

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

        // POST /api/pages/{slug}/contact - Submit contact form for a published page
        api.MapPost("/pages/{slug}/contact", async (
            string slug,
            ContactSubmissionRequest request,
            AppDbContext db,
            HttpContext httpContext) =>
        {
            Log.Information("Contact form submission for page: {Slug}", slug);

            // Find published page
            var page = await db.Pages
                .AsNoTracking()
                .Where(p => p.Slug == slug && p.IsPublished)
                .FirstOrDefaultAsync();

            if (page is null)
            {
                Log.Information("Page not found or not published: {Slug}", slug);
                return Results.NotFound(new { error = "Page not found" });
            }

            // Find first contact-form section
            var contactFormSection = FindContactFormSection(page.Sections);
            if (contactFormSection is null)
            {
                Log.Information("No contact-form section found in page: {Slug}", slug);
                return Results.NotFound(new { error = "Page not found" });
            }

            // Validate submission against section schema
            var validationErrors = ValidateContactSubmission(request.Fields, contactFormSection.Value);
            if (validationErrors.Count > 0)
            {
                return Results.BadRequest(new { error = "ValidationFailed", details = validationErrors });
            }

            // Get recipient email from section
            var recipientEmail = contactFormSection.Value.GetProperty("recipientEmail").GetString() ?? string.Empty;

            // Get client info
            var ip = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();

            // Store the message
            var entity = new ContactMessageEntity
            {
                PageSlug = slug,
                RecipientEmail = recipientEmail,
                Fields = JsonSerializer.Serialize(request.Fields),
                Ip = ip,
                UserAgent = string.IsNullOrEmpty(userAgent) ? null : userAgent
            };

            db.ContactMessages.Add(entity);
            await db.SaveChangesAsync();

            Log.Information("Contact message saved: {Id} for page {Slug}", entity.Id, slug);

            return Results.Accepted(value: new { id = entity.Id, createdAt = entity.CreatedAt });
        }).RequireRateLimiting(ServiceCollectionExtensions.ContactSubmitRateLimitPolicy);

        return api;
    }

    private static JsonElement? FindContactFormSection(string sectionsJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(sectionsJson);
            foreach (var section in doc.RootElement.EnumerateArray())
            {
                if (section.TryGetProperty("type", out var typeElement) &&
                    typeElement.GetString() == "contact-form" &&
                    section.TryGetProperty("data", out var dataElement))
                {
                    // Clone to avoid disposal issues
                    return JsonSerializer.Deserialize<JsonElement>(dataElement.GetRawText());
                }
            }
        }
        catch
        {
            // Invalid JSON, return null
        }

        return null;
    }

    private static List<string> ValidateContactSubmission(Dictionary<string, string>? submittedFields, JsonElement sectionData)
    {
        var errors = new List<string>();

        if (submittedFields is null)
        {
            errors.Add("fields is required");
            return errors;
        }

        // Get defined fields from section
        if (!sectionData.TryGetProperty("fields", out var fieldsElement) ||
            fieldsElement.ValueKind != JsonValueKind.Array)
        {
            // Should not happen if page was validated, but handle gracefully
            errors.Add("Contact form configuration is invalid");
            return errors;
        }

        var definedFields = new Dictionary<string, (string type, bool required)>();
        foreach (var field in fieldsElement.EnumerateArray())
        {
            if (field.TryGetProperty("name", out var nameElement) &&
                field.TryGetProperty("type", out var typeElement))
            {
                var name = nameElement.GetString();
                var type = typeElement.GetString();
                var required = false;

                if (field.TryGetProperty("required", out var requiredElement) &&
                    requiredElement.ValueKind == JsonValueKind.True)
                {
                    required = true;
                }

                if (!string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(type))
                {
                    definedFields[name] = (type, required);
                }
            }
        }

        // Check for unknown fields
        foreach (var key in submittedFields.Keys)
        {
            if (!definedFields.ContainsKey(key))
            {
                errors.Add($"fields.{key} is not allowed");
            }
        }

        // Validate each defined field
        foreach (var (name, (type, required)) in definedFields)
        {
            var hasValue = submittedFields.TryGetValue(name, out var value);
            var isEmpty = string.IsNullOrWhiteSpace(value);

            // Check required fields
            if (required && (!hasValue || isEmpty))
            {
                errors.Add($"fields.{name} is required");
                continue;
            }

            // Skip type validation if field not provided and not required
            if (!hasValue || isEmpty)
            {
                continue;
            }

            // Type-specific validation
            switch (type)
            {
                case "email":
                    if (!value!.Contains('@') || value.Contains(' '))
                    {
                        errors.Add($"fields.{name} must be a valid email");
                    }
                    break;

                case "phone":
                    // Allow digits, spaces, +, -, parentheses
                    if (!IsValidPhone(value!))
                    {
                        errors.Add($"fields.{name} must be a valid phone number");
                    }
                    break;

                case "text":
                case "textarea":
                    // Any non-empty string is valid
                    break;
            }
        }

        return errors;
    }

    private static bool IsValidPhone(string value)
    {
        // Allow digits, spaces, +, -, parentheses, and dots
        foreach (var c in value)
        {
            if (!char.IsDigit(c) && c != ' ' && c != '+' && c != '-' && c != '(' && c != ')' && c != '.')
            {
                return false;
            }
        }
        return value.Length > 0;
    }
}

/// <summary>
/// Request body for contact form submission.
/// </summary>
public record ContactSubmissionRequest(Dictionary<string, string>? Fields);
