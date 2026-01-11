using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        path: "/app/logs/api-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14)
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    Log.Information("Starting API in {Environment} environment", builder.Environment.EnvironmentName);

    // Configure EF Core with PostgreSQL
    var connectionString = builder.Configuration.GetConnectionString("Default");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));

    var app = builder.Build();

    // Apply migrations in Development
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

    var infoResponse = new
    {
        name = "YigisoftCorporateCMS.Api",
        version = "0.0.0",
        phase = "1.1c"
    };

    // Root-level endpoints (direct container access)
    app.MapGet("/health", () => Results.Ok("OK"));
    app.MapGet("/info", () => Results.Ok(infoResponse));

    // API route group (nginx proxies /api/* here)
    var api = app.MapGroup("/api");
    api.MapGet("/health", () => Results.Ok("OK"));
    api.MapGet("/info", () => Results.Ok(infoResponse));

    // Database connectivity check
    api.MapGet("/db-check", async (AppDbContext db) =>
    {
        try
        {
            var canConnect = await db.Database.CanConnectAsync();
            return Results.Ok(new { ok = true, canConnect });
        }
        catch
        {
            return Results.Ok(new { ok = false, canConnect = false });
        }
    });

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

    // Development-only endpoints
    if (app.Environment.IsDevelopment())
    {
        var dev = api.MapGroup("/dev");

        // POST /api/dev/seed - Seed sample data
        dev.MapPost("/seed", async (AppDbContext db) =>
        {
            Log.Information("Seeding development data...");

            var existingPage = await db.Pages.FirstOrDefaultAsync(p => p.Slug == "home");

            var sectionsJson = """
            [
              {
                "type": "hero",
                "data": {
                  "title": "Welcome to YigisoftCorporateCMS",
                  "subtitle": "A modern, section-based content management system",
                  "ctaText": "Get Started",
                  "ctaLink": "/admin"
                }
              },
              {
                "type": "features",
                "data": {
                  "title": "Features",
                  "items": [
                    { "icon": "blocks", "title": "Section Builder", "description": "Compose pages from reusable blocks" },
                    { "icon": "zap", "title": "Fast Performance", "description": "Optimized for speed with JSONB storage" },
                    { "icon": "shield", "title": "Secure", "description": "Built with security best practices" }
                  ]
                }
              },
              {
                "type": "cta",
                "data": {
                  "title": "Ready to get started?",
                  "buttonText": "Contact Us",
                  "buttonLink": "/contact"
                }
              }
            ]
            """;

            if (existingPage is null)
            {
                var page = new PageEntity
                {
                    Slug = "home",
                    Title = "Home",
                    MetaTitle = "Home | YigisoftCorporateCMS",
                    MetaDescription = "Welcome to our corporate website powered by YigisoftCorporateCMS",
                    Sections = sectionsJson,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Pages.Add(page);
                Log.Information("Created new home page");
            }
            else
            {
                existingPage.Title = "Home";
                existingPage.MetaTitle = "Home | YigisoftCorporateCMS";
                existingPage.MetaDescription = "Welcome to our corporate website powered by YigisoftCorporateCMS";
                existingPage.Sections = sectionsJson;
                existingPage.IsPublished = true;
                existingPage.UpdatedAt = DateTime.UtcNow;
                Log.Information("Updated existing home page");
            }

            await db.SaveChangesAsync();

            Log.Information("Development data seeded successfully");
            return Results.Ok(new { ok = true, seeded = true });
        });
    }

    Log.Information("API started - phase {Phase}", "1.1c");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
