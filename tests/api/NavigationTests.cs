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
            items = new object[]
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

    [Fact]
    public async Task AdminNavigation_NestedThreeLevels_Succeeds()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new object[]
            {
                new
                {
                    id = "products",
                    label = "Products",
                    type = "page",
                    slug = "products",
                    order = 1,
                    isVisible = true,
                    children = new object[]
                    {
                        new
                        {
                            id = "batteries",
                            label = "Batteries",
                            type = "page",
                            slug = "products/batteries",
                            order = 1,
                            isVisible = true,
                            children = new object[]
                            {
                                new
                                {
                                    id = "lifepo4",
                                    label = "LiFePO4",
                                    type = "page",
                                    slug = "products/batteries/lifepo4",
                                    order = 1,
                                    isVisible = true
                                }
                            }
                        }
                    }
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-nested-3", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        // Verify 3-level structure
        var items = root.GetProperty("items");
        Assert.Equal(1, items.GetArrayLength());

        var level1 = items[0];
        Assert.Equal("Products", level1.GetProperty("label").GetString());
        var level1Children = level1.GetProperty("children");
        Assert.Equal(1, level1Children.GetArrayLength());

        var level2 = level1Children[0];
        Assert.Equal("Batteries", level2.GetProperty("label").GetString());
        var level2Children = level2.GetProperty("children");
        Assert.Equal(1, level2Children.GetArrayLength());

        var level3 = level2Children[0];
        Assert.Equal("LiFePO4", level3.GetProperty("label").GetString());

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_NestedFourLevels_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new object[]
            {
                new
                {
                    label = "Level1",
                    type = "page",
                    slug = "l1",
                    order = 1,
                    isVisible = true,
                    children = new object[]
                    {
                        new
                        {
                            label = "Level2",
                            type = "page",
                            slug = "l2",
                            order = 1,
                            isVisible = true,
                            children = new object[]
                            {
                                new
                                {
                                    label = "Level3",
                                    type = "page",
                                    slug = "l3",
                                    order = 1,
                                    isVisible = true,
                                    children = new object[]
                                    {
                                        new
                                        {
                                            label = "Level4", // Too deep!
                                            type = "page",
                                            slug = "l4",
                                            order = 1,
                                            isVisible = true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-depth-4", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        var details = root.GetProperty("details").ToString();
        Assert.Contains("Maximum nesting depth", details);

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_DuplicateIds_Returns400()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new object[]
            {
                new
                {
                    id = "same-id",
                    label = "Item 1",
                    type = "page",
                    slug = "item1",
                    order = 1,
                    isVisible = true
                },
                new
                {
                    id = "same-id", // Duplicate!
                    label = "Item 2",
                    type = "page",
                    slug = "item2",
                    order = 2,
                    isVisible = true
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-dup-id", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var root = doc.RootElement;

        Assert.Equal("ValidationFailed", root.GetProperty("error").GetString());
        var details = root.GetProperty("details").ToString();
        Assert.Contains("Duplicate", details);
        Assert.Contains("same-id", details);

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_SortsByOrder()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new object[]
            {
                new
                {
                    id = "third",
                    label = "Third",
                    type = "page",
                    slug = "third",
                    order = 3,
                    isVisible = true
                },
                new
                {
                    id = "first",
                    label = "First",
                    type = "page",
                    slug = "first",
                    order = 1,
                    isVisible = true
                },
                new
                {
                    id = "second",
                    label = "Second",
                    type = "page",
                    slug = "second",
                    order = 2,
                    isVisible = true,
                    children = new object[]
                    {
                        new
                        {
                            id = "child-b",
                            label = "Child B",
                            type = "page",
                            slug = "child-b",
                            order = 2,
                            isVisible = true
                        },
                        new
                        {
                            id = "child-a",
                            label = "Child A",
                            type = "page",
                            slug = "child-a",
                            order = 1,
                            isVisible = true
                        }
                    }
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-sorting", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var items = doc.RootElement.GetProperty("items");

        // Items should be sorted by order
        Assert.Equal("First", items[0].GetProperty("label").GetString());
        Assert.Equal("Second", items[1].GetProperty("label").GetString());
        Assert.Equal("Third", items[2].GetProperty("label").GetString());

        // Children should also be sorted
        var secondChildren = items[1].GetProperty("children");
        Assert.Equal("Child A", secondChildren[0].GetProperty("label").GetString());
        Assert.Equal("Child B", secondChildren[1].GetProperty("label").GetString());

        client.Dispose();
    }

    [Fact]
    public async Task AdminNavigation_FlatStructureBackwardCompatible()
    {
        // Arrange - old flat structure without children property
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
                    label = "About",
                    type = "page",
                    slug = "about",
                    order = 2,
                    isVisible = true
                }
            }
        };

        // Act
        var response = await client.PutAsJsonAsync("/api/admin/navigation?key=test-flat", navRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var items = doc.RootElement.GetProperty("items");

        Assert.Equal(2, items.GetArrayLength());

        // Items should have empty children arrays
        Assert.True(items[0].TryGetProperty("children", out var children1));
        Assert.Equal(0, children1.GetArrayLength());
        Assert.True(items[1].TryGetProperty("children", out var children2));
        Assert.Equal(0, children2.GetArrayLength());

        client.Dispose();
    }

    [Fact]
    public async Task PublicNavigation_ReturnsNestedStructure()
    {
        // Arrange
        var (client, _) = await GetAuthenticatedClientAsync();

        var navRequest = new
        {
            items = new object[]
            {
                new
                {
                    id = "products",
                    label = "Products",
                    type = "page",
                    slug = "products",
                    order = 1,
                    isVisible = true,
                    children = new object[]
                    {
                        new
                        {
                            id = "widgets",
                            label = "Widgets",
                            type = "page",
                            slug = "widgets",
                            order = 1,
                            isVisible = true
                        }
                    }
                }
            }
        };

        // Create the navigation
        await client.PutAsJsonAsync("/api/admin/navigation?key=test-public-nested", navRequest);

        // Act - fetch via public endpoint
        client.DefaultRequestHeaders.Authorization = null;
        var response = await client.GetAsync("/api/public/navigation?key=test-public-nested");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(content);
        var items = doc.RootElement.GetProperty("items");

        Assert.Equal(1, items.GetArrayLength());
        var children = items[0].GetProperty("children");
        Assert.Equal(1, children.GetArrayLength());
        Assert.Equal("Widgets", children[0].GetProperty("label").GetString());

        client.Dispose();
    }
}
