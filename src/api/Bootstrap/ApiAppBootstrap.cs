using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Extensions;

namespace YigisoftCorporateCMS.Api.Bootstrap;

/// <summary>
/// Configures the application pipeline (middleware, endpoints).
/// </summary>
public static class ApiAppBootstrap
{
    /// <summary>
    /// Configures the application pipeline.
    /// </summary>
    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        // Apply migrations in Development
        ApplyMigrationsIfDevelopment(app);

        // Middleware
        app.UseAuthentication();
        app.UseAuthorization();

        // Map all endpoints
        app.MapApiEndpoints();

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
