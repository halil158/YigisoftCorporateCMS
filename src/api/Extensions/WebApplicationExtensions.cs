using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;

namespace YigisoftCorporateCMS.Api.Extensions;

/// <summary>
/// Extension methods for WebApplication to configure the pipeline.
/// </summary>
public static class WebApplicationExtensions
{
    /// <summary>
    /// Configures the application middleware pipeline.
    /// </summary>
    public static WebApplication UseApiPipeline(this WebApplication app)
    {
        // Apply migrations in Development
        ApplyMigrationsIfDevelopment(app);

        // Forwarded headers must be FIRST to get real client IP from nginx
        app.UseForwardedHeaders();

        // Swagger UI (Development only)
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger(options =>
            {
                options.RouteTemplate = "api/swagger/{documentName}/swagger.json";
            });

            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/api/swagger/v1/swagger.json", "YigisoftCorporateCMS API v1");
                options.RoutePrefix = "api/swagger";
            });

            Log.Information("Swagger UI enabled at /api/swagger");
        }

        // Rate limiting (after forwarded headers so we use real client IP)
        app.UseRateLimiter();

        // Authentication & Authorization
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }

    private static void ApplyMigrationsIfDevelopment(WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            try
            {
                Log.Information("Applying database migrations...");
                db.Database.Migrate();
                Log.Information("Database migrations applied successfully");
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Failed to apply database migrations");
                throw;
            }
        }
        else
        {
            Log.Information("Skipping auto-migration (not in Development environment)");
        }
    }
}
