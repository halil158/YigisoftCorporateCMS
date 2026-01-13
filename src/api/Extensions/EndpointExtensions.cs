using Serilog;
using YigisoftCorporateCMS.Api.Endpoints;

namespace YigisoftCorporateCMS.Api.Extensions;

/// <summary>
/// Extension methods for registering API endpoints.
/// </summary>
public static class EndpointExtensions
{
    /// <summary>
    /// Maps all API endpoints.
    /// </summary>
    public static WebApplication MapApiEndpoints(this WebApplication app)
    {
        // Root-level endpoints (direct container access)
        app.MapInfoEndpoints();

        // API route group (nginx proxies /api/* here)
        var api = app.MapGroup("/api");
        api.MapApiInfoEndpoints();
        api.MapPublicPagesEndpoints();
        api.MapPublicNavigationEndpoints();
        api.MapAuthEndpoints();

        // Development-only endpoints
        if (app.Environment.IsDevelopment())
        {
            api.MapDevEndpoints();
        }

        // Admin endpoints (require Admin role)
        var admin = api.MapGroup("/admin")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        admin.MapAdminPagesEndpoints();
        admin.MapAdminUploadsEndpoints();
        admin.MapAdminContactMessagesEndpoints();
        admin.MapAdminNavigationEndpoints();

        Log.Information("API started - phase {Phase}", "3.1");

        return app;
    }
}
