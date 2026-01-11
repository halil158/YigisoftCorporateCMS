using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

    /// <summary>
    /// Registers all application services.
    /// </summary>
    public static WebApplicationBuilder AddApiServices(this WebApplicationBuilder builder)
    {
        Log.Information("Starting API in {Environment} environment", builder.Environment.EnvironmentName);

        // Configure EF Core with PostgreSQL
        var connectionString = builder.Configuration.GetConnectionString("Default");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        // Configure JWT Authentication
        ConfigureAuthentication(builder);

        builder.Services.AddAuthorization();

        // Register application services
        builder.Services.AddUploads(builder.Configuration);

        // OpenAPI / Swagger (Development only, but services registered always for simplicity)
        if (builder.Environment.IsDevelopment())
        {
            ConfigureSwagger(builder);
        }

        return builder;
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
