using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Integration tests for admin pages CRUD endpoints.
/// </summary>
public class AdminPagesTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AdminPagesTests(ApiWebApplicationFactory factory)
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
    public async Task CreatePage_WithValidSections_Returns201()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var pageRequest = new
        {
            slug = "test-page-valid",
            title = "Test Page",
            metaTitle = "Test Page Title",
            metaDescription = "Test page description",
            sections = """[{"type":"hero","data":{"title":"Welcome"}}]""",
            isPublished = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/admin/pages", pageRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("id", out var id));
        Assert.False(string.IsNullOrEmpty(id.GetString()));
        Assert.Equal("test-page-valid", root.GetProperty("slug").GetString());
        Assert.Equal("Test Page", root.GetProperty("title").GetString());

        client.Dispose();
    }

    [Fact]
    public async Task CreatePage_WithUnknownSectionType_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var pageRequest = new
        {
            slug = "test-page-invalid-type",
            title = "Test Page",
            sections = """[{"type":"unknown-type","data":{"title":"Welcome"}}]""",
            isPublished = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/admin/pages", pageRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        Assert.True(root.TryGetProperty("details", out var details));
        Assert.True(details.GetArrayLength() > 0);

        client.Dispose();
    }

    [Fact]
    public async Task CreatePage_WithMissingRequiredField_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        // CTA section requires buttonText and buttonUrl
        var pageRequest = new
        {
            slug = "test-page-missing-fields",
            title = "Test Page",
            sections = """[{"type":"cta","data":{"title":"Click Me"}}]""",
            isPublished = false
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/admin/pages", pageRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        Assert.True(root.TryGetProperty("details", out var details));

        // Should mention missing buttonText and buttonUrl
        var detailsText = details.ToString();
        Assert.Contains("buttonText", detailsText);
        Assert.Contains("buttonUrl", detailsText);

        client.Dispose();
    }
}
