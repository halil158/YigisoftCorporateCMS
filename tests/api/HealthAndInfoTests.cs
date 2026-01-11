using System.Net;
using System.Text.Json;
using Xunit;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Integration tests for health and info endpoints.
/// </summary>
public class HealthAndInfoTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public HealthAndInfoTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetHealth_ReturnsOk()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("\"OK\"", body);
    }

    [Fact]
    public async Task GetInfo_ReturnsExpectedStructure()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/info");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        // Check that required fields exist and are non-empty
        Assert.True(root.TryGetProperty("name", out var name));
        Assert.False(string.IsNullOrEmpty(name.GetString()));

        Assert.True(root.TryGetProperty("version", out var version));
        Assert.False(string.IsNullOrEmpty(version.GetString()));

        Assert.True(root.TryGetProperty("phase", out var phase));
        Assert.False(string.IsNullOrEmpty(phase.GetString()));
    }
}
