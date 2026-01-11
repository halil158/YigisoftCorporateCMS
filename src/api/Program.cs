using Serilog;
using YigisoftCorporateCMS.Api.Bootstrap;
using YigisoftCorporateCMS.Api.Extensions;

// Configure Serilog
ApiLoggingBootstrap.ConfigureSerilog();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // Register all services
    builder.Services.AddApiServices(builder.Configuration, builder.Environment);

    var app = builder.Build();

    // Configure middleware pipeline
    app.UseApiPipeline();

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
