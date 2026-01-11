using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Security;
using YigisoftCorporateCMS.Api.Validation.Sections;

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

    if (string.IsNullOrWhiteSpace(jwtSigningKey))
        throw new InvalidOperationException("Jwt:SigningKey must be configured");

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
        phase = "1.4a"
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
                  "primaryCta": { "text": "Get Started", "url": "/admin" }
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
                  "buttonUrl": "/contact"
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

    // Admin endpoints (require Admin role)
    var admin = api.MapGroup("/admin").RequireAuthorization(policy => policy.RequireRole("Admin"));

    // Slug validation regex: lowercase alphanumeric with hyphens
    var slugRegex = new Regex(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    // Validation helper - returns (isValid, singleError, sectionErrors)
    // singleError is for simple field errors, sectionErrors is for detailed section validation
    static (bool isValid, string? error, List<string>? sectionErrors) ValidatePageRequest(PageUpsertRequest request, Regex slugRegex)
    {
        // Validate slug
        if (string.IsNullOrWhiteSpace(request.Slug))
            return (false, "Slug is required", null);

        var slug = request.Slug.Trim().ToLowerInvariant();
        if (!slugRegex.IsMatch(slug))
            return (false, "Slug must be lowercase alphanumeric with hyphens (e.g., 'my-page-slug')", null);

        // Validate title
        if (string.IsNullOrWhiteSpace(request.Title))
            return (false, "Title is required", null);

        if (request.Title.Length > 200)
            return (false, "Title must be 200 characters or less", null);

        // Validate sections JSON
        if (string.IsNullOrWhiteSpace(request.Sections))
            return (false, "Sections is required", null);

        try
        {
            using var doc = JsonDocument.Parse(request.Sections);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                return (false, "Sections must be a JSON array", null);
        }
        catch (JsonException)
        {
            return (false, "Sections must be valid JSON", null);
        }

        // Validate sections schema (type registry)
        var sectionErrors = SectionsValidator.Validate(request.Sections);
        if (sectionErrors.Count > 0)
            return (false, null, sectionErrors);

        return (true, null, null);
    }

    // GET /api/admin/pages - List all pages
    admin.MapGet("/pages", async (AppDbContext db) =>
    {
        var pages = await db.Pages
            .AsNoTracking()
            .OrderByDescending(p => p.UpdatedAt)
            .Select(p => new PageAdminListItemDto(
                p.Id,
                p.Slug,
                p.Title,
                p.IsPublished,
                p.UpdatedAt
            ))
            .ToListAsync();

        return Results.Ok(pages);
    });

    // GET /api/admin/pages/{id:guid} - Get page by ID
    admin.MapGet("/pages/{id:guid}", async (Guid id, AppDbContext db) =>
    {
        var page = await db.Pages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (page is null)
            return Results.NotFound(new { error = "Page not found" });

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

    // POST /api/admin/pages - Create page
    admin.MapPost("/pages", async (PageUpsertRequest request, AppDbContext db) =>
    {
        var (isValid, error, sectionErrors) = ValidatePageRequest(request, slugRegex);
        if (!isValid)
        {
            if (sectionErrors is not null)
                return Results.BadRequest(new { error = "ValidationFailed", details = sectionErrors });
            return Results.BadRequest(new { error });
        }

        var slug = request.Slug.Trim().ToLowerInvariant();

        // Check slug uniqueness
        var slugExists = await db.Pages.AnyAsync(p => p.Slug == slug);
        if (slugExists)
        {
            Log.Warning("Page creation failed: slug conflict for {Slug}", slug);
            return Results.Conflict(new { error = "A page with this slug already exists", code = "slug_conflict" });
        }

        var page = new PageEntity
        {
            Slug = slug,
            Title = request.Title.Trim(),
            MetaTitle = request.MetaTitle?.Trim(),
            MetaDescription = request.MetaDescription?.Trim(),
            Sections = request.Sections,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Pages.Add(page);
        await db.SaveChangesAsync();

        Log.Information("Page created: {PageId} ({Slug})", page.Id, page.Slug);

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

        return Results.Created($"/api/admin/pages/{page.Id}", dto);
    });

    // PUT /api/admin/pages/{id:guid} - Update page
    admin.MapPut("/pages/{id:guid}", async (Guid id, PageUpsertRequest request, AppDbContext db) =>
    {
        var (isValid, error, sectionErrors) = ValidatePageRequest(request, slugRegex);
        if (!isValid)
        {
            if (sectionErrors is not null)
                return Results.BadRequest(new { error = "ValidationFailed", details = sectionErrors });
            return Results.BadRequest(new { error });
        }

        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
        if (page is null)
            return Results.NotFound(new { error = "Page not found" });

        var slug = request.Slug.Trim().ToLowerInvariant();

        // Check slug uniqueness (excluding current page)
        var slugExists = await db.Pages.AnyAsync(p => p.Slug == slug && p.Id != id);
        if (slugExists)
        {
            Log.Warning("Page update failed: slug conflict for {Slug} (PageId: {PageId})", slug, id);
            return Results.Conflict(new { error = "A page with this slug already exists", code = "slug_conflict" });
        }

        page.Slug = slug;
        page.Title = request.Title.Trim();
        page.MetaTitle = request.MetaTitle?.Trim();
        page.MetaDescription = request.MetaDescription?.Trim();
        page.Sections = request.Sections;
        page.IsPublished = request.IsPublished;
        page.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        Log.Information("Page updated: {PageId} ({Slug})", page.Id, page.Slug);

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

    // DELETE /api/admin/pages/{id:guid} - Delete page
    admin.MapDelete("/pages/{id:guid}", async (Guid id, AppDbContext db) =>
    {
        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
        if (page is null)
            return Results.NotFound(new { error = "Page not found" });

        var slug = page.Slug;
        db.Pages.Remove(page);
        await db.SaveChangesAsync();

        Log.Information("Page deleted: {PageId} ({Slug})", id, slug);

        return Results.NoContent();
    });

    // POST /api/admin/pages/{id:guid}/publish - Publish page
    admin.MapPost("/pages/{id:guid}/publish", async (Guid id, AppDbContext db) =>
    {
        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
        if (page is null)
            return Results.NotFound(new { error = "Page not found" });

        page.IsPublished = true;
        page.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        Log.Information("Page published: {PageId} ({Slug})", page.Id, page.Slug);

        return Results.Ok(new { id = page.Id, slug = page.Slug, isPublished = true });
    });

    // POST /api/admin/pages/{id:guid}/unpublish - Unpublish page
    admin.MapPost("/pages/{id:guid}/unpublish", async (Guid id, AppDbContext db) =>
    {
        var page = await db.Pages.FirstOrDefaultAsync(p => p.Id == id);
        if (page is null)
            return Results.NotFound(new { error = "Page not found" });

        page.IsPublished = false;
        page.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        Log.Information("Page unpublished: {PageId} ({Slug})", page.Id, page.Slug);

        return Results.Ok(new { id = page.Id, slug = page.Slug, isPublished = false });
    });

    // Upload configuration constants
    const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
    var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".webp", ".svg", ".pdf"
    };

    // POST /api/admin/uploads - Upload a file
    admin.MapPost("/uploads", async (IFormFile? file) =>
    {
        var errors = new List<string>();

        // Validate file is provided
        if (file is null || file.Length == 0)
        {
            errors.Add("File is required and must not be empty");
            return Results.BadRequest(new { error = "ValidationFailed", details = errors });
        }

        // Validate file size
        if (file.Length > MaxFileSizeBytes)
        {
            errors.Add($"File size exceeds maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB");
            return Results.BadRequest(new { error = "ValidationFailed", details = errors });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
        {
            var allowed = string.Join(", ", allowedExtensions.Order());
            errors.Add($"File type '{extension}' is not allowed. Allowed types: {allowed}");
            return Results.BadRequest(new { error = "ValidationFailed", details = errors });
        }

        try
        {
            // Generate safe filename and path
            var now = DateTime.UtcNow;
            var directory = $"/uploads/{now:yyyy}/{now:MM}";
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(directory, fileName);

            // Ensure directory exists
            Directory.CreateDirectory(directory);

            // Save file
            await using var stream = new FileStream(Path.Combine(directory, fileName), FileMode.Create);
            await file.CopyToAsync(stream);

            var publicUrl = $"/uploads/{now:yyyy}/{now:MM}/{fileName}";

            Log.Information("File uploaded: {FilePath} ({Size} bytes)", publicUrl, file.Length);

            return Results.Created(publicUrl, new
            {
                url = publicUrl,
                fileName,
                contentType = file.ContentType,
                size = file.Length
            });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Failed to upload file");
            return Results.Problem(
                detail: "An error occurred while uploading the file",
                statusCode: 500
            );
        }
    }).DisableAntiforgery();

    Log.Information("API started - phase {Phase}", "1.4a");

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
