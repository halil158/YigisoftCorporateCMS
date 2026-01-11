using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace YigisoftCorporateCMS.Api.Tests;

/// <summary>
/// Integration tests for admin uploads endpoints.
/// </summary>
public class AdminUploadsTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    // Base64 encoded 1x1 red PNG (67 bytes)
    private const string TestPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    public AdminUploadsTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private async Task<HttpClient> GetAuthenticatedClientAsync()
    {
        var client = _factory.CreateClient();
        await client.PostAsync("/api/dev/seed", null);

        var loginRequest = new { email = "admin@yigisoft.local", password = "Admin123!" };
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(loginContent);
        var token = doc.RootElement.GetProperty("token").GetString()!;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task UploadFile_WithValidPng_Returns201()
    {
        // Arrange
        using var client = await GetAuthenticatedClientAsync();

        var fileContent = Convert.FromBase64String(TestPngBase64);
        using var content = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent(fileContent);
        fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        content.Add(fileStreamContent, "file", "test.png");

        // Act
        var response = await client.PostAsync("/api/admin/uploads", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var responseContent = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseContent);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("id", out var id));
        Assert.False(string.IsNullOrEmpty(id.GetString()));

        Assert.True(root.TryGetProperty("url", out var url));
        Assert.StartsWith("/uploads/", url.GetString());

        Assert.True(root.TryGetProperty("contentType", out var contentType));
        Assert.Equal("image/png", contentType.GetString());
    }

    [Fact]
    public async Task ListUploads_AfterUpload_ContainsEntry()
    {
        // Arrange - upload a file first
        using var client = await GetAuthenticatedClientAsync();

        var fileContent = Convert.FromBase64String(TestPngBase64);
        using var uploadContent = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent(fileContent);
        fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        uploadContent.Add(fileStreamContent, "file", "list-test.png");

        var uploadResponse = await client.PostAsync("/api/admin/uploads", uploadContent);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        var uploadResponseContent = await uploadResponse.Content.ReadAsStringAsync();
        using var uploadDoc = JsonDocument.Parse(uploadResponseContent);
        var uploadedId = uploadDoc.RootElement.GetProperty("id").GetString();

        // Act
        var listResponse = await client.GetAsync("/api/admin/uploads");

        // Assert
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        var listContent = await listResponse.Content.ReadAsStringAsync();
        using var listDoc = JsonDocument.Parse(listContent);

        Assert.Equal(JsonValueKind.Array, listDoc.RootElement.ValueKind);
        Assert.True(listDoc.RootElement.GetArrayLength() > 0);

        // Find our uploaded file
        var found = false;
        foreach (var item in listDoc.RootElement.EnumerateArray())
        {
            if (item.GetProperty("id").GetString() == uploadedId)
            {
                found = true;
                break;
            }
        }
        Assert.True(found, "Uploaded file should appear in list");
    }

    [Fact]
    public async Task DeleteUpload_AfterUpload_Returns204()
    {
        // Arrange - upload a file first
        using var client = await GetAuthenticatedClientAsync();

        var fileContent = Convert.FromBase64String(TestPngBase64);
        using var uploadContent = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent(fileContent);
        fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        uploadContent.Add(fileStreamContent, "file", "delete-test.png");

        var uploadResponse = await client.PostAsync("/api/admin/uploads", uploadContent);
        Assert.Equal(HttpStatusCode.Created, uploadResponse.StatusCode);

        var uploadResponseContent = await uploadResponse.Content.ReadAsStringAsync();
        using var uploadDoc = JsonDocument.Parse(uploadResponseContent);
        var uploadedId = uploadDoc.RootElement.GetProperty("id").GetString();

        // Act
        var deleteResponse = await client.DeleteAsync($"/api/admin/uploads/{uploadedId}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task UploadFile_WithDisallowedExtension_Returns400()
    {
        // Arrange
        using var client = await GetAuthenticatedClientAsync();

        using var content = new MultipartFormDataContent();
        var fileStreamContent = new ByteArrayContent([0x00, 0x01, 0x02]);
        fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileStreamContent, "file", "test.exe");

        // Act
        var response = await client.PostAsync("/api/admin/uploads", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
