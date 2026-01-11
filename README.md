# YigisoftCorporateCMS

A modular corporate website content management system with a section-based page builder, running on Docker.

## Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | React (Public + Admin)    |
| Backend     | .NET 10 Web API           |
| Database    | PostgreSQL                |
| Proxy       | Nginx                     |
| Container   | Docker / Docker Compose   |

## Repository Layout

```
YigisoftCorporateCMS/
├── apps/
│   ├── public-web/       # React public-facing site
│   └── admin/            # React admin panel
├── src/
│   └── api/              # .NET 10 Web API
├── infra/
│   ├── nginx/            # Nginx configuration
│   └── postgres/         # PostgreSQL config/scripts
├── docs/
│   └── architecture/     # Architecture documentation
└── .env.example          # Environment template
```

## Planned Nginx Routes

| Route              | Target                  |
|--------------------|-------------------------|
| `/`                | Public React app        |
| `/admin`           | Admin React app         |
| `/api/*`           | .NET API                |
| `/uploads/*`       | Static file storage     |

## Development

### Quick Start

```bash
# Start all services
docker compose up -d --build

# Check health
curl http://localhost:8080/health
```

### Swagger / OpenAPI (Dev only)

In Development, Swagger UI is available for API exploration:

- **Swagger UI:** http://localhost:8080/api/swagger
- **OpenAPI JSON:** http://localhost:8080/api/swagger/v1/swagger.json

Use the "Authorize" button to enter your JWT token for protected endpoints.

### Authentication (Dev)

1. **Seed the dev admin user:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/dev/seed" -Method POST
```

2. **Login to get a JWT token:**
```powershell
$body = @{ email = "admin@yigisoft.local"; password = "Admin123!" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.token
```

3. **Access protected endpoints:**
```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/me" -Headers $headers
```

### Admin Pages CRUD

Manage pages via the admin API (requires Admin role):

```powershell
# 1. Get token (after seeding)
$body = @{ email = "admin@yigisoft.local"; password = "Admin123!" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$headers = @{ Authorization = "Bearer $($response.token)" }

# 2. Create a draft page
$page = @{
    slug = "about-us"
    title = "About Us"
    metaTitle = "About Us | YigisoftCorporateCMS"
    metaDescription = "Learn more about our company"
    sections = '[{"type":"hero","data":{"title":"About Us"}}]'
    isPublished = $false
} | ConvertTo-Json
$created = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Method POST -Body $page -ContentType "application/json" -Headers $headers
$created

# 3. List all pages
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Headers $headers

# 4. Verify draft is NOT publicly accessible
Invoke-RestMethod -Uri "http://localhost:8080/api/pages/about-us"  # Returns 404

# 5. Publish the page
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages/$($created.id)/publish" -Method POST -Headers $headers

# 6. Verify published page IS publicly accessible
Invoke-RestMethod -Uri "http://localhost:8080/api/pages/about-us"  # Returns 200 with page data
```

### Sections Validation

Sections are validated against a type registry. Supported types: `hero`, `features`, `cta`.

```powershell
# Valid page with hero section
$page = @{
    slug = "valid-page"
    title = "Valid Page"
    sections = '[{"type":"hero","data":{"title":"Welcome"}}]'
    isPublished = $false
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Method POST -Body $page -ContentType "application/json" -Headers $headers
# Returns 201 Created

# Invalid: unknown section type
$page = @{
    slug = "invalid-type"
    title = "Invalid"
    sections = '[{"type":"unknown","data":{}}]'
    isPublished = $false
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Method POST -Body $page -ContentType "application/json" -Headers $headers
# Returns 400: { error: "ValidationFailed", details: ["sections[0].type 'unknown' is not supported..."] }

# Invalid: missing required field
$page = @{
    slug = "missing-field"
    title = "Missing"
    sections = '[{"type":"cta","data":{"title":"Buy Now"}}]'
    isPublished = $false
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Method POST -Body $page -ContentType "application/json" -Headers $headers
# Returns 400: { error: "ValidationFailed", details: ["sections[0].data.buttonText is required", "sections[0].data.buttonUrl is required"] }
```

### Uploads

Upload files via the admin API (requires Admin role):

```powershell
# Upload an image
$headers = @{ Authorization = "Bearer $($response.token)" }
$filePath = "C:\path\to\image.png"
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/uploads" -Method POST -Headers $headers -Form @{ file = Get-Item $filePath }
# Returns 201: { url: "/uploads/2026/01/abc123.png", fileName: "abc123.png", contentType: "image/png", size: 12345 }
```

```bash
# Using curl
curl -X POST http://localhost:8080/api/admin/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./image.png"
```

Allowed file types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.pdf` (max 10 MB).

### Local Ports

| Service    | Port |
|------------|------|
| Nginx      | 8080 |
| PostgreSQL | 5434 |

## License

See [LICENSE](LICENSE) for details.
