using Serilog;
using YigisoftCorporateCMS.Api.Bootstrap;

// Configure Serilog
ApiLoggingBootstrap.ConfigureSerilog();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // Register services
    builder.AddApiServices();

    var app = builder.Build();

    // Configure pipeline
    app.ConfigurePipeline();

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
