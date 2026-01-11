using Microsoft.EntityFrameworkCore;
using YigisoftCorporateCMS.Api.Data;

namespace YigisoftCorporateCMS.Api.Endpoints;

/// <summary>
/// Health and info endpoints.
/// </summary>
public static class InfoEndpoints
{
    private static readonly object InfoResponse = new
    {
        name = "YigisoftCorporateCMS.Api",
        version = "0.0.0",
        phase = "1.7a"
    };

    public static IEndpointRouteBuilder MapInfoEndpoints(this IEndpointRouteBuilder app)
    {
        // Root-level endpoints (direct container access)
        app.MapGet("/health", () => Results.Ok("OK"));
        app.MapGet("/info", () => Results.Ok(InfoResponse));

        return app;
    }

    public static IEndpointRouteBuilder MapApiInfoEndpoints(this IEndpointRouteBuilder api)
    {
        api.MapGet("/health", () => Results.Ok("OK"));
        api.MapGet("/info", () => Results.Ok(InfoResponse));

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

        return api;
    }
}
