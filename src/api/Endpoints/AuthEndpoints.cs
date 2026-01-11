using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using YigisoftCorporateCMS.Api.Bootstrap;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Dtos;
using YigisoftCorporateCMS.Api.Security;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Authentication endpoints (login, me).
/// </summary>
public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder api)
    {
        // POST /api/auth/login - Authenticate user and issue JWT (rate limited: 5/min per IP)
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
        }).RequireRateLimiting(ApiServicesBootstrap.LoginRateLimitPolicy);

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

        return api;
    }
}
