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

### Local Ports

| Service    | Port |
|------------|------|
| Nginx      | 8080 |
| PostgreSQL | 5434 |

## License

See [LICENSE](LICENSE) for details.
