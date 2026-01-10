var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var infoResponse = new
{
    name = "YigisoftCorporateCMS.Api",
    version = "0.0.0",
    phase = "0.2c2"
};

// Root-level endpoints (direct container access)
app.MapGet("/health", () => Results.Ok("OK"));
app.MapGet("/info", () => Results.Ok(infoResponse));

// API route group (nginx proxies /api/* here)
var api = app.MapGroup("/api");
api.MapGet("/health", () => Results.Ok("OK"));
api.MapGet("/info", () => Results.Ok(infoResponse));

app.Run();
