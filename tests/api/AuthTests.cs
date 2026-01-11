using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Integration tests for authentication endpoints.
/// </summary>
public class AuthTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AuthTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetAuthMe_WithoutToken_Returns401()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/auth/me");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_AfterSeed_ReturnsToken()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var seedResponse = await client.PostAsync("/api/dev/seed", null);
        Assert.Equal(HttpStatusCode.OK, seedResponse.StatusCode);

        // Act - login
        var loginRequest = new { email = "admin@yigisoft.local", password = "Admin123!" };
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("token", out var token));
        Assert.False(string.IsNullOrEmpty(token.GetString()));
    }

    [Fact]
    public async Task GetAuthMe_WithValidToken_Returns200()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Seed first
        var seedResponse = await client.PostAsync("/api/dev/seed", null);
        Assert.Equal(HttpStatusCode.OK, seedResponse.StatusCode);

        // Login
        var loginRequest = new { email = "admin@yigisoft.local", password = "Admin123!" };
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Ensure login succeeded
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginContent);
        var token = doc.RootElement.GetProperty("token").GetString()!;

        // Act - use request-specific header
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var meDoc = JsonDocument.Parse(content);
        var root = meDoc.RootElement;

        // The /auth/me endpoint returns { isAuthenticated, subject, name, roles }
        Assert.True(root.TryGetProperty("isAuthenticated", out _) || root.TryGetProperty("subject", out _));
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        // Arrange
        using var client = _factory.CreateClient();
        await client.PostAsync("/api/dev/seed", null);

        // Act - login with wrong password
        var loginRequest = new { email = "admin@yigisoft.local", password = "WrongPassword!" };
        var response = await client.PostAsJsonAsync("/api/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
