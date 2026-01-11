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

### Admin Panel

The admin panel is accessible at http://localhost:8080/admin/

1. **Seed the dev admin user** (if not already done):
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/dev/seed" -Method POST
```

2. **Open the admin panel** and login with:
   - Email: `admin@yigisoft.local`
   - Password: `Admin123!`

**Note:** The admin app runs under the `/admin/` subpath. All routes are prefixed with `/admin/`.

**Available routes:**
- `/admin/` - Dashboard
- `/admin/pages` - Pages list (create, edit, delete, publish/unpublish)
- `/admin/pages/new` - Create new page
- `/admin/pages/:id` - Edit page

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

Sections are validated against a type registry. Supported types:
- `hero`, `features`, `cta` — Basic page sections
- `testimonials`, `gallery` — Content showcase sections
- `contact-form` — Form with configurable fields (text, email, textarea, phone)

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

Upload and manage files via the admin API (requires Admin role).

#### Generate a test image (PowerShell)

Create a minimal valid 1x1 red PNG for testing (works in PS 5.1 and PS 7+):

```powershell
# Base64 of a 1x1 red PNG (67 bytes)
$png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
[IO.File]::WriteAllBytes("$PWD\test.png", [Convert]::FromBase64String($png))
```

#### PowerShell 7+ (using -Form)

```powershell
# Upload an image (PS7+ only - uses -Form)
$headers = @{ Authorization = "Bearer $($response.token)" }
$upload = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/uploads" -Method POST -Headers $headers -Form @{ file = Get-Item "test.png" }
# Returns 201: { id: "guid", url: "/uploads/2026/01/abc123.png", ... }

# List uploads
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/uploads?take=10" -Headers $headers

# Delete an upload
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/uploads/$($upload.id)" -Method DELETE -Headers $headers
```

#### Windows PowerShell 5.1 (using curl.exe)

```powershell
# Upload an image (PS 5.1 compatible - uses curl.exe)
$token = $response.token
$upload = curl.exe -s -X POST "http://localhost:8080/api/admin/uploads" `
  -H "Authorization: Bearer $token" `
  -F "file=@test.png" | ConvertFrom-Json
$upload
# Returns: { id: "guid", url: "/uploads/2026/01/abc123.png", ... }

# List uploads
curl.exe -s "http://localhost:8080/api/admin/uploads?take=10" `
  -H "Authorization: Bearer $token" | ConvertFrom-Json

# Delete an upload
curl.exe -s -X DELETE "http://localhost:8080/api/admin/uploads/$($upload.id)" `
  -H "Authorization: Bearer $token"

# Verify file is accessible via nginx
curl.exe -s -o NUL -w "%{http_code}" "http://localhost:8080$($upload.url)"
# Returns: 200
```

#### Bash / Linux

```bash
# Upload
curl -X POST http://localhost:8080/api/admin/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./image.png"

# List uploads
curl http://localhost:8080/api/admin/uploads \
  -H "Authorization: Bearer $TOKEN"

# Delete upload
curl -X DELETE "http://localhost:8080/api/admin/uploads/{id}" \
  -H "Authorization: Bearer $TOKEN"
```

Allowed file types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.pdf` (max 10 MB).

### Contact Form Submission

Submit contact form data for published pages with a `contact-form` section.

```powershell
# 1. First create a page with a contact-form section
$page = @{
    slug = "contact"
    title = "Contact Us"
    sections = '[{"type":"contact-form","data":{"title":"Get in Touch","recipientEmail":"info@example.com","fields":[{"name":"email","label":"Email","type":"email","required":true},{"name":"message","label":"Message","type":"textarea","required":true}]}}]'
    isPublished = $true
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/pages" -Method POST -Body $page -ContentType "application/json" -Headers $headers

# 2. Submit contact form (public, no auth required)
$submission = @{
    fields = @{
        email = "visitor@example.com"
        message = "Hello, I have a question..."
    }
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8080/api/pages/contact/contact" -Method POST -Body $submission -ContentType "application/json"
# Returns 202: { id: "guid", createdAt: "2026-01-12T10:30:00Z" }

# 3. List contact messages (admin) - with filtering & pagination
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages" -Headers $headers
# Filter by page slug
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages?pageSlug=contact" -Headers $headers
# Filter unprocessed messages
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages?processed=false" -Headers $headers
# Filter processed messages
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages?processed=true" -Headers $headers
# Pagination
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages?skip=0&take=10" -Headers $headers

# 4. Get message details (admin)
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages/{id}" -Headers $headers

# 5. Mark as processed (admin)
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/contact-messages/{id}/mark-processed" -Method PATCH -Headers $headers
```

#### Bash / Linux

```bash
# Submit contact form (public)
curl -X POST http://localhost:8080/api/pages/contact/contact \
  -H "Content-Type: application/json" \
  -d '{"fields":{"email":"visitor@example.com","message":"Hello!"}}'

# List messages (admin) - with filtering
curl "http://localhost:8080/api/admin/contact-messages?processed=false&take=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Rate limit:** 10 submissions per hour per IP address.

### Local Ports

| Service    | Port |
|------------|------|
| Nginx      | 8080 |
| PostgreSQL | 5434 |

## Testing

Integration tests use [Testcontainers](https://testcontainers.com/) to spin up a PostgreSQL instance automatically.

**Requirements:**
- Docker must be running

**Run tests:**
```bash
dotnet test
```

**Run tests with code coverage:**
```bash
# Collect coverage
dotnet test --collect:"XPlat Code Coverage" --results-directory ./TestResults

# Generate HTML report (requires ReportGenerator)
dotnet tool install --global dotnet-reportgenerator-globaltool
reportgenerator -reports:"TestResults/**/coverage.cobertura.xml" -targetdir:"coverage-report" -reporttypes:"Html"

# Open coverage-report/index.html in browser
```

**Test coverage areas:**
- Health and info endpoints
- Authentication flow (seed, login, protected endpoints)
- Admin pages CRUD with section validation
- Admin uploads (upload, list, delete)

## CI

GitHub Actions runs on push and pull request to `main`:
- NuGet package caching for faster builds
- Locked-mode restore (`--locked-mode`) for deterministic builds
- Build and test with code coverage collection
- Coverage report uploaded as workflow artifact (downloadable from Actions tab)

**Note:** CI will fail if `packages.lock.json` is out of sync. Run `dotnet restore` locally to regenerate it after package changes.

## License

See [LICENSE](LICENSE) for details.
