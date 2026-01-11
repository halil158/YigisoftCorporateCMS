using Serilog;

namespace YigisoftCorporateCMS.Api.Bootstrap;

/// <summary>
/// Configures Serilog logging for the API.
/// </summary>
public static class ApiLoggingBootstrap
{
    /// <summary>
    /// Configures Serilog with console and rolling file sinks.
    /// </summary>
    public static void ConfigureSerilog()
    {
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
    }
}
