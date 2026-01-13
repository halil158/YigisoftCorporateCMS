using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Integration tests for navigation endpoints.
/// </summary>
public class NavigationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public NavigationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<(HttpClient client, string token)> GetAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        await client.PostAsync("/api/dev/seed", null);

        var loginRequest = new { email = "admin@yigisoft.local", password = "Admin123!" };
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginContent);
        var token = doc.RootElement.GetProperty("token").GetString()!;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (client, token);
    }

    [Fact]
    public async Task PublicNavigation_WhenNoRecord_ReturnsEmptyItems()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/public/navigation?key=nonexistent");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("nonexistent", root.GetProperty("key").GetString());
        Assert.True(root.TryGetProperty("items", out var items));
        Assert.Equal(0, items.GetArrayLength());

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_PutThenGet_ReturnsItems()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new[]
            {
                new
                {
                    label = "Home",
                    type = "page",
                    slug = "home",
                    order = 1,
                    isVisible = true
                },
                new
                {
                    label = "Docs",
                    type = "external",
                    url = "https://docs.example.com",
                    order = 2,
                    isVisible = true,
                    newTab = true
                }
            }
        };

        // Act - Update
        var putResponse = await client.PutAsJsonAsync("/api/admin/navigation?key=test-nav", navRequest);

        // Assert - Update succeeded
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        // Act - Get via admin
        var adminGetResponse = await client.GetAsync("/api/admin/navigation?key=test-nav");

        // Assert - Admin get
        Assert.Equal(HttpStatusCode.OK, adminGetResponse.StatusCode);
        var adminContent = await adminGetResponse.Content.ReadAsStringAsync();
        using var adminDoc = JsonDocument.Parse(adminContent);
        var adminRoot = adminDoc.RootElement;

        Assert.Equal("test-nav", adminRoot.GetProperty("key").GetString());
        var adminItems = adminRoot.GetProperty("items");
        Assert.Equal(2, adminItems.GetArrayLength());

        // Act - Get via public endpoint (no auth needed)
        client.DefaultRequestHeaders.Authorization = null;
        var publicGetResponse = await client.GetAsync("/api/public/navigation?key=test-nav");

        // Assert - Public get returns same items
        Assert.Equal(HttpStatusCode.OK, publicGetResponse.StatusCode);
        var publicContent = await publicGetResponse.Content.ReadAsStringAsync();
        using var publicDoc = JsonDocument.Parse(publicContent);
        var publicRoot = publicDoc.RootElement;

        Assert.Equal("test-nav", publicRoot.GetProperty("key").GetString());
        var publicItems = publicRoot.GetProperty("items");
        Assert.Equal(2, publicItems.GetArrayLength());

        // Verify item properties
        var firstItem = publicItems[0];
        Assert.Equal("Home", firstItem.GetProperty("label").GetString());
        Assert.Equal("page", firstItem.GetProperty("type").GetString());
        Assert.Equal("home", firstItem.GetProperty("slug").GetString());

        var secondItem = publicItems[1];
        Assert.Equal("Docs", secondItem.GetProperty("label").GetString());
        Assert.Equal("external", secondItem.GetProperty("type").GetString());
        Assert.Equal("https://docs.example.com", secondItem.GetProperty("url").GetString());
        Assert.True(secondItem.GetProperty("newTab").GetBoolean());

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_WithMissingLabel_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new[]
            {
                new
                {
                    label = "", // Missing
                    type = "page",
                    slug = "home",
                    order = 1,
                    isVisible = true
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-invalid", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        var details = root.GetProperty("details").ToString();
        Assert.Contains("label", details);

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_ExternalWithInvalidUrl_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new[]
            {
                new
                {
                    label = "Bad Link",
                    type = "external",
                    url = "not-a-valid-url", // Doesn't start with http(s)
                    order = 1,
                    isVisible = true
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-invalid-url", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        var details = root.GetProperty("details").ToString();
        Assert.Contains("url", details);
        Assert.Contains("http", details);

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_PageWithMissingSlug_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new[]
            {
                new
                {
                    label = "Home",
                    type = "page",
                    slug = "", // Missing for page type
                    order = 1,
                    isVisible = true
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-no-slug", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        var details = root.GetProperty("details").ToString();
        Assert.Contains("slug", details);

        client.Dispose();
    }
}
