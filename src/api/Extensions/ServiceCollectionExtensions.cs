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
using YigisoftCorporateCMS.Api.Uploads;

namespace YigisoftCorporateCMS.Api.Extensions;

/// <summary>
/// Extension methods for IServiceCollection to register application services.
/// </summary>
public static class ServiceCollectionExtensions
{
    private const string DevPlaceholderKey = "DEVELOPMENT-ONLY-KEY-REPLACE-IN-PRODUCTION-MIN-32-CHARS";

    // Rate limiting policy names (public for endpoint use)
    public const string LoginRateLimitPolicy = "login";
    public const string UploadRateLimitPolicy = "upload";
    public const string ContactSubmitRateLimitPolicy = "contact-submit";
    public const string GlobalRateLimitPolicy = "global";

    /// <summary>
    /// Registers all application services (orchestrator method).
    /// </summary>
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        Log.Information("Starting API in {Environment} environment", environment.EnvironmentName);

        services.AddForwardedHeaders();
        services.AddDatabase(configuration);
        services.AddApiAuthentication(configuration, environment);
        services.AddAuthorization();
        services.AddApiRateLimiting();
        services.AddUploads(configuration);

        if (environment.IsDevelopment())
        {
            services.AddSwaggerDocumentation();
        }

        return services;
    }

    /// <summary>
    /// Configures forwarded headers for nginx proxy.
    /// </summary>
    public static IServiceCollection AddForwardedHeaders(this IServiceCollection services)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            // Trust nginx proxy (clear defaults to accept from any proxy in Docker network)
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });

        return services;
    }

    /// <summary>
    /// Configures EF Core with PostgreSQL.
    /// </summary>
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

        return services;
    }

    /// <summary>
    /// Configures JWT Bearer authentication.
    /// </summary>
    public static IServiceCollection AddApiAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "YigisoftCorporateCMS";
        var jwtAudience = configuration["Jwt:Audience"] ?? "YigisoftCorporateCMS";
        var jwtSigningKey = configuration["Jwt:SigningKey"];

        // Enforce secure signing key in non-Development environments
        if (!environment.IsDevelopment())
        {
            if (string.IsNullOrEmpty(jwtSigningKey) || jwtSigningKey == DevPlaceholderKey || jwtSigningKey.Length < 32)
            {
                throw new InvalidOperationException(
                    "Production requires a secure Jwt:SigningKey (minimum 32 characters, not the dev placeholder)");
            }
        }

        if (string.IsNullOrWhiteSpace(jwtSigningKey))
            throw new InvalidOperationException("Jwt:SigningKey must be configured");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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

        return services;
    }

    /// <summary>
    /// Configures rate limiting policies.
    /// </summary>
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
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

            // Contact form submission: 10 requests per hour per IP
            options.AddPolicy(ContactSubmitRateLimitPolicy, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: GetClientIp(httpContext),
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromHours(1),
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

        return services;
    }

    /// <summary>
    /// Registers upload service and configuration.
    /// </summary>
    public static IServiceCollection AddUploads(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure upload options from configuration (if available)
        services.Configure<UploadOptions>(options =>
        {
            // Allow overrides via configuration
            var maxSize = configuration.GetValue<long?>("Uploads:MaxFileSizeBytes");
            if (maxSize.HasValue)
                options.MaxFileSizeBytes = maxSize.Value;

            var basePath = configuration.GetValue<string>("Uploads:BaseUploadPath");
            if (!string.IsNullOrEmpty(basePath))
                options.BaseUploadPath = basePath;

            var publicUrl = configuration.GetValue<string>("Uploads:PublicBaseUrl");
            if (!string.IsNullOrEmpty(publicUrl))
                options.PublicBaseUrl = publicUrl;

            var extensions = configuration.GetSection("Uploads:AllowedExtensions").Get<string[]>();
            if (extensions is { Length: > 0 })
            {
                options.AllowedExtensions = new HashSet<string>(extensions, StringComparer.OrdinalIgnoreCase);
            }
        });

        services.AddScoped<IImageProcessingService, ImageProcessingService>();
        services.AddScoped<IUploadService, UploadService>();
        services.AddScoped<YigisoftCorporateCMS.Api.Services.MediaUsageService>();

        return services;
    }

    /// <summary>
    /// Configures Swagger/OpenAPI documentation (Development only).
    /// </summary>
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
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

        return services;
    }

    private static string GetClientIp(HttpContext httpContext)
    {
        // After ForwardedHeaders middleware, RemoteIpAddress reflects real client IP
        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
