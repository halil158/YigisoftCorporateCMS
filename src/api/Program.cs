using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Security;

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
    const string DevPlaceholderKey = "DEVELOPMENT-ONLY-KEY-REPLACE-IN-PRODUCTION-MIN-32-CHARS";
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "YigisoftCorporateCMS";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "YigisoftCorporateCMS";
    var jwtSigningKey = builder.Configuration["Jwt:SigningKey"];

    // Enforce secure signing key in non-Development environments
    if (!builder.Environment.IsDevelopment())
    {
        if (string.IsNullOrEmpty(jwtSigningKey) || jwtSigningKey == DevPlaceholderKey || jwtSigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Production requires a secure Jwt:SigningKey (minimum 32 characters, not the dev placeholder)");
        }
    }

    jwtSigningKey ??= throw new InvalidOperationException("Jwt:SigningKey must be configured");

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
        phase = "1.2a2"
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

            // Seed admin user
            const string adminEmail = "admin@yigisoft.local";
            var normalizedEmail = adminEmail.ToLowerInvariant().Trim();
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.EmailNormalized == normalizedEmail);

            if (existingUser is null)
            {
                existingUser = new UserEntity
                {
                    Email = adminEmail,
                    EmailNormalized = normalizedEmail,
                    DisplayName = "Dev Admin",
                    PasswordHash = PasswordHasher.Hash("Admin123!"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Users.Add(existingUser);
                Log.Information("Created dev admin user: {Email}", adminEmail);
            }
            else
            {
                existingUser.DisplayName = "Dev Admin";
                existingUser.PasswordHash = PasswordHasher.Hash("Admin123!");
                existingUser.IsActive = true;
                existingUser.UpdatedAt = DateTime.UtcNow;
                Log.Information("Updated dev admin user: {Email}", adminEmail);
            }

            // Ensure Admin role claim exists
            var adminRoleClaim = await db.Claims.FirstOrDefaultAsync(c => c.Type == "role" && c.Value == "Admin");
            if (adminRoleClaim is null)
            {
                adminRoleClaim = new ClaimEntity
                {
                    Type = "role",
                    Value = "Admin",
                    CreatedAt = DateTime.UtcNow
                };
                db.Claims.Add(adminRoleClaim);
                Log.Information("Created Admin role claim");
            }

            await db.SaveChangesAsync();

            // Link user to claim if not already linked
            var userClaimExists = await db.UserClaims
                .AnyAsync(uc => uc.UserId == existingUser.Id && uc.ClaimId == adminRoleClaim.Id);

            if (!userClaimExists)
            {
                db.UserClaims.Add(new UserClaimEntity
                {
                    UserId = existingUser.Id,
                    ClaimId = adminRoleClaim.Id
                });
                await db.SaveChangesAsync();
                Log.Information("Linked user {Email} to Admin role", adminEmail);
            }

            Log.Information("Development data seeded successfully");
            return Results.Ok(new { ok = true, seeded = true, adminEmail });
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

    // POST /api/auth/login - Authenticate user and issue JWT
    api.MapPost("/auth/login", async (LoginRequest request, AppDbContext db, IConfiguration config) =>
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Results.BadRequest(new { error = "Email and password are required" });
        }

        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.EmailNormalized == normalizedEmail);

        if (user is null)
        {
            Log.Information("Login failed: user not found for {Email}", normalizedEmail);
            return Results.Unauthorized();
        }

        if (!user.IsActive)
        {
            Log.Information("Login failed: user is inactive {Email}", normalizedEmail);
            return Results.Unauthorized();
        }

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            Log.Information("Login failed: invalid password for {Email}", normalizedEmail);
            return Results.Unauthorized();
        }

        // Load user claims from junction table
        var userClaims = await db.UserClaims
            .AsNoTracking()
            .Where(uc => uc.UserId == user.Id)
            .Include(uc => uc.Claim)
            .Select(uc => uc.Claim)
            .ToListAsync();

        // Build JWT claims
        var jwtClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Name, user.DisplayName),
            new(ClaimTypes.Name, user.DisplayName),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add role claims and other claims
        var roles = new List<string>();
        foreach (var claim in userClaims)
        {
            if (claim.Type == "role")
            {
                jwtClaims.Add(new Claim(ClaimTypes.Role, claim.Value));
                roles.Add(claim.Value);
            }
            else
            {
                jwtClaims.Add(new Claim(claim.Type, claim.Value));
            }
        }

        var issuer = config["Jwt:Issuer"] ?? "YigisoftCorporateCMS";
        var audience = config["Jwt:Audience"] ?? "YigisoftCorporateCMS";
        var signingKey = config["Jwt:SigningKey"]!;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: jwtClaims,
            expires: DateTime.UtcNow.AddMinutes(60),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        Log.Information("Login successful for {Email}", user.Email);
        return Results.Ok(new
        {
            token = tokenString,
            expiresIn = 3600,
            user = new
            {
                id = user.Id,
                email = user.Email,
                displayName = user.DisplayName,
                roles = roles.ToArray()
            }
        });
    });

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

    Log.Information("API started - phase {Phase}", "1.2a2");

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
