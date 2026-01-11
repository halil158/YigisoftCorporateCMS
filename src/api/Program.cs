using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Extensions;

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

    // Register application services
    builder.Services.AddUploads(builder.Configuration);

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

    // Middleware
    app.UseAuthentication();
    app.UseAuthorization();

    // Map all endpoints
    app.MapApiEndpoints();

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
