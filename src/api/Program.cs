using Microsoft.EntityFrameworkCore;
using Serilog;
using YigisoftCorporateCMS.Api.Data;

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

    // Configure EF Core with PostgreSQL
    var connectionString = builder.Configuration.GetConnectionString("Default");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));

    var app = builder.Build();

    // Apply migrations in Development
    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Log.Information("Applying database migrations...");
        db.Database.Migrate();
        Log.Information("Database migrations applied successfully");
    }

    var infoResponse = new
    {
        name = "YigisoftCorporateCMS.Api",
        version = "0.0.0",
        phase = "1.1a"
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

    Log.Information("API started - phase {Phase}", "1.1a");

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
