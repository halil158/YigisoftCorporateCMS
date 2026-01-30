using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Entities;

namespace YigisoftCorporateCMS.Api.Seeding;

/// <summary>
/// Seeds required CMS data on application startup.
/// </summary>
public static class CmsSeeder
{
    /// <summary>
    /// The reserved slug for the home page.
    /// </summary>
    public const string HomePageSlug = "home";

    /// <summary>
    /// Ensures required pages exist. Runs after migrations.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await EnsureHomePageExistsAsync(db);
    }

    private static async Task EnsureHomePageExistsAsync(AppDbContext db)
    {
        var homePageExists = await db.Pages.AnyAsync(p => p.Slug == HomePageSlug);

        if (homePageExists)
        {
            Log.Debug("Home page already exists, skipping seed");
            return;
        }

        Log.Information("Seeding Home page...");

        var sectionsJson = """
        [
          {
            "type": "hero",
            "data": {
              "title": "Welcome",
              "subtitle": "Your website is ready to be customized",
              "primaryCta": { "text": "Get Started", "url": "/admin" }
            }
          }
        ]
        """;

        var homePage = new PageEntity
        {
            Slug = HomePageSlug,
            Title = "Home",
            MetaTitle = "Home",
            MetaDescription = "Welcome to our website",
            Sections = sectionsJson,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Pages.Add(homePage);
        await db.SaveChangesAsync();

        Log.Information("Home page seeded successfully (Id: {PageId})", homePage.Id);
    }
}
