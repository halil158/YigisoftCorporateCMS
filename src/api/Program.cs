var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/health", () => Results.Ok("OK"));

app.MapGet("/info", () => Results.Ok(new
{
    name = "YigisoftCorporateCMS.Api",
    version = "0.0.0",
    phase = "0.2c1"
}));

app.Run();
