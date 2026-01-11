using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;
using Xunit;
using YigisoftCorporateCMS.Api.Data;
using YigisoftCorporateCMS.Api.Uploads;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Custom WebApplicationFactory that uses a PostgreSQL Testcontainer for integration tests.
/// </summary>
public class ApiWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16.11-alpine")
        .WithDatabase("test_db")
        .WithUsername("test_user")
        .WithPassword("test_password")
        .Build();

    private string _tempUploadsPath = null!;

    public string TempUploadsPath => _tempUploadsPath;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            // Add DbContext with Testcontainer connection string
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString()));

            // Configure temp uploads path
            services.Configure<UploadOptions>(options =>
            {
                options.BaseUploadPath = _tempUploadsPath;
            });
        });
    }

    public async Task InitializeAsync()
    {
        // Create temp uploads directory
        _tempUploadsPath = Path.Combine(Path.GetTempPath(), $"yigisoft-tests-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempUploadsPath);

        await _postgres.StartAsync();

        // Ensure migrations are applied
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();

        // Clean up temp uploads directory
        if (Directory.Exists(_tempUploadsPath))
        {
            try
            {
                Directory.Delete(_tempUploadsPath, recursive: true);
            }
            catch
            {
                // Ignore cleanup errors
            }
        }

        await base.DisposeAsync();
    }
}
