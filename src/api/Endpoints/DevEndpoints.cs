using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Entities;
using YigisoftCorporateCMS.Api.Security;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Development-only endpoints (seed, token generation).
/// </summary>
public static class DevEndpoints
{
    public static IEndpointRouteBuilder MapDevEndpoints(this IEndpointRouteBuilder api)
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

        return api;
    }
}
