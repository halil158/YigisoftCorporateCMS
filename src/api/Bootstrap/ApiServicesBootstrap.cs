using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Extensions;

namespace YigisoftCorporateCMS.Api.Bootstrap;

/// <summary>
/// Configures application services (DI registrations).
/// </summary>
public static class ApiServicesBootstrap
{
    private const string DevPlaceholderKey = "DEVELOPMENT-ONLY-KEY-REPLACE-IN-PRODUCTION-MIN-32-CHARS";

    // Rate limiting policy names
    public const string LoginRateLimitPolicy = "login";
    public const string UploadRateLimitPolicy = "upload";
    public const string GlobalRateLimitPolicy = "global";

    /// <summary>
    /// Registers all application services.
    /// </summary>
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder)
    {
        Log.Information("Starting API in {Environment} environment", builder.Environment.EnvironmentName);

        // Configure forwarded headers (for nginx proxy)
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            // Trust nginx proxy (clear defaults to accept from any proxy in Docker network)
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        // Configure EF Core with PostgreSQL
        var connectionString = builder.Configuration.GetConnectionString("Default");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        // Configure JWT Authentication
        ConfigureAuthentication(builder);

        builder.Services.AddAuthorization();

        // Configure rate limiting
        ConfigureRateLimiting(builder);

        // Register application services
        builder.Services.AddUploads(builder.Configuration);

        // OpenAPI / Swagger (Development only, but services registered always for simplicity)
        if (builder.Environment.IsDevelopment())
        {
            ConfigureSwagger(builder);
        }

        return builder;
    }

    private static void ConfigureRateLimiting(WebApplicationBuilder builder)
    {
        builder.Services.AddRateLimiter(options =>
        {
            // Custom 429 response
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.HttpContext.Response.ContentType = "application/json";

                var retryAfter = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue)
                    ? (int)retryAfterValue.TotalSeconds
                    : 60;

                if (retryAfterValue != default)
                {
                    context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString();
                }

                var response = new
                {
                    error = "RateLimited",
                    message = "Too many requests",
                    retryAfterSeconds = retryAfter
                };

                await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);

                Log.Warning("Rate limit exceeded for {Policy} from {IP}",
                    context.Lease.GetType().Name,
                    context.HttpContext.Connection.RemoteIpAddress);
            };

            // Login: 5 requests per minute per IP
            options.AddPolicy(LoginRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            // Upload: 30 requests per minute per IP
            options.AddPolicy(UploadRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 30,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            // Global: 100 requests per minute per IP (mild, for /api/* excluding health/info)
            options.AddPolicy(GlobalRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });
    }

    private static string GetClientIp(HttpContext httpContext)
    {
        // After ForwardedHeaders middleware, RemoteIpAddress reflects real client IP
        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private static void ConfigureSwagger(WebApplicationBuilder builder)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "YigisoftCorporateCMS API",
                Version = "v1",
                Description = "Corporate website CMS API with section-based page builder"
            });

            // JWT Bearer security scheme
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token (without 'Bearer ' prefix)"
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
    }

    private static void ConfigureAuthentication(WebApplicationBuilder builder)
    {
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
    }
}
