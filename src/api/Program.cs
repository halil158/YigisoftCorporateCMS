using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

    // Configure JWT Authentication
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "YigisoftCorporateCMS";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "YigisoftCorporateCMS";
    var jwtSigningKey = builder.Configuration["Jwt:SigningKey"]
        ?? throw new InvalidOperationException("Jwt:SigningKey must be configured");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey))
            };
        });

    builder.Services.AddAuthorization();

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

    // Authentication & Authorization middleware
    app.UseAuthentication();
    app.UseAuthorization();

    var infoResponse = new
    {
        name = "YigisoftCorporateCMS.Api",
        version = "0.0.0",
        phase = "1.2a1"
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

        // POST /api/dev/token - Generate a dev JWT token
        dev.MapPost("/token", (IConfiguration config) =>
        {
            Log.Information("Generating development token...");

            var issuer = config["Jwt:Issuer"] ?? "YigisoftCorporateCMS";
            var audience = config["Jwt:Audience"] ?? "YigisoftCorporateCMS";
            var signingKey = config["Jwt:SigningKey"]
                ?? throw new InvalidOperationException("Jwt:SigningKey must be configured");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, "dev-admin"),
                new Claim(JwtRegisteredClaimNames.Name, "Dev Admin"),
                new Claim(ClaimTypes.Role, "Admin"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            Log.Information("Development token generated for subject: dev-admin");
            return Results.Ok(new { token = tokenString, expiresIn = 3600 });
        });
    }

    // GET /api/auth/me - Protected endpoint returning authenticated user info
    api.MapGet("/auth/me", (ClaimsPrincipal user) =>
    {
        var subject = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var name = user.FindFirst(JwtRegisteredClaimNames.Name)?.Value
            ?? user.FindFirst(ClaimTypes.Name)?.Value;
        var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();

        return Results.Ok(new
        {
            isAuthenticated = true,
            subject,
            name,
            roles
        });
    }).RequireAuthorization();

    Log.Information("API started - phase {Phase}", "1.2a1");

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
