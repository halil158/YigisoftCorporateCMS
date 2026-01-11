# Architecture Overview

## Stack Summary

| Component      | Technology                  | Purpose                              |
|----------------|-----------------------------|--------------------------------------|
| Container      | Docker / Docker Compose     | Deployment and local development     |
| Proxy          | Nginx                       | Routing, static files, SSL           |
| Public Web     | React                       | Visitor-facing website               |
| Admin Panel    | React                       | Content management interface         |
| API            | .NET 10 (Minimal API)       | Backend services, business logic     |
| Database       | PostgreSQL                  | Persistent data storage              |

---

## Deployment Approach

**Customer-per-stack model:**
- Each customer runs their own isolated Docker Compose stack
- Stacks are independent: separate containers, database, and volume storage
- Enables per-customer customization and data isolation
- Scaling: horizontal via multiple stacks, not shared infrastructure

```
Customer A                    Customer B
┌─────────────────────┐      ┌─────────────────────┐
│ nginx               │      │ nginx               │
│ public-web          │      │ public-web          │
│ admin               │      │ admin               │
│ api                 │      │ api                 │
│ postgres            │      │ postgres            │
└─────────────────────┘      └─────────────────────┘
```

---

## Routing

Nginx handles all inbound traffic and routes to appropriate services:

| Route          | Target                  | Description                          |
|----------------|-------------------------|--------------------------------------|
| `/`            | public-web:80           | Public corporate website             |
| `/admin/`      | admin:80                | Admin panel (authenticated)          |
| `/api/*`       | api:5000                | Backend API endpoints                |
| `/uploads/*`   | Static volume           | User-uploaded media files            |

### API Endpoints

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| GET    | `/api/health`        | Health check                         |
| GET    | `/api/info`          | API version and phase info           |
| GET    | `/api/db-check`      | Database connectivity check          |
| GET    | `/api/pages/{slug}`  | Get published page by slug           |
| GET    | `/api/auth/me`       | Get authenticated user info (protected) |
| POST   | `/api/dev/seed`      | Seed sample data (Development only)  |
| POST   | `/api/dev/token`     | Generate JWT token (Development only)|

---

## Data Model Approach

**Block-based CMS with JSONB sections:**

Pages are stored with their content as structured JSONB, enabling flexible section-based composition.

### Pages Table Schema

| Column           | Type          | Constraints                    |
|------------------|---------------|--------------------------------|
| id               | uuid          | PK, default gen_random_uuid() |
| slug             | text          | unique, required               |
| title            | text          | required                       |
| meta_title       | text          | nullable                       |
| meta_description | text          | nullable                       |
| sections         | jsonb         | required, default '[]'         |
| is_published     | boolean       | default false                  |
| created_at       | timestamptz   | default now()                  |
| updated_at       | timestamptz   | default now()                  |

### Sections JSONB Structure

```json
[
  { "type": "hero", "data": { ... } },
  { "type": "features", "data": { ... } },
  { "type": "cta", "data": { ... } }
]
```

**Benefits:**
- Flexible section types without schema migrations
- Fast reads (single query per page)
- Section data validated at API layer

---

## Uploads Handling

1. **Upload flow:** Admin panel → API → saves to shared volume
2. **Storage:** `_data/uploads/` on host, mounted at `/uploads` in both API and Nginx containers
3. **Serving:** Nginx directly serves `/uploads/*` for performance (with 7-day cache headers)
4. **Path format:** `/uploads/{year}/{month}/{filename}`

**Note:** Create `_data/uploads/` manually before first run (folder is gitignored).

---

## Authentication

**JWT Bearer authentication:**

| Setting         | Default Value            | Description                         |
|-----------------|--------------------------|-------------------------------------|
| `Jwt:Issuer`    | YigisoftCorporateCMS     | Token issuer claim                  |
| `Jwt:Audience`  | YigisoftCorporateCMS     | Token audience claim                |
| `Jwt:SigningKey`| (dev placeholder)        | HMAC-SHA256 signing key (min 32 chars) |

**Configuration:** Settings can be overridden via environment variables (`Jwt__Issuer`, `Jwt__Audience`, `Jwt__SigningKey`).

**Protected endpoints:** Use `RequireAuthorization()` in minimal API. Returns 401 Unauthorized without valid token.

**Development token:** Use `POST /api/dev/token` to get a test JWT (dev-admin, Admin role, 60-min expiry).

---

## Logging

| Service | Destination | Notes |
|---------|-------------|-------|
| API     | stdout + `_data/logs/api/` | Serilog with daily rolling files, 14-day retention |
| Nginx   | stdout only | Access via `docker logs yigisoft-nginx` |
| Postgres| stdout only | Access via `docker logs yigisoft-postgres` |

**API log files:** Located in `_data/logs/api/` on the host (bind mount). Files are named `api-YYYYMMDD.log` and rotate daily.

---

## Development Phases

| Phase   | Focus                                      | Status      |
|---------|--------------------------------------------|-------------|
| 0.1     | Repo scaffold, architecture docs           | Done        |
| 0.2a    | Docker Compose base (nginx + postgres)     | Done        |
| 0.2b    | Nginx routing + placeholder services       | Done        |
| 0.2c1   | .NET 10 API stub + Dockerfile              | Done        |
| 0.2c2   | API in Docker Compose + nginx routing      | Done        |
| 0.2c3   | API logging with Serilog                   | Done        |
| 0.3a    | Uploads volume + nginx static serving      | Done        |
| 0.3b    | Standardize uploads mount path             | Done        |
| 1.1a    | EF Core + PostgreSQL, Pages table          | Done        |
| 1.1b    | EF Core config refactor + Postgres port    | Done        |
| 1.1c    | Pages read endpoint + dev seed             | Done        |
| 1.2a1   | JWT auth infrastructure + protected endpoint| Done        |
| 1.2a1.1 | Pin NuGet versions + lock file             | Done        |
| 1.2a1.2 | Pin Docker images + locked NuGet restore   | Done        |
| 1.x     | Backend core (auth, pages, sections, API)  | In Progress |
| 2.x     | Admin panel (section builder, media)       | Planned     |
| 3.x     | Public web (rendering, SEO)                | Planned     |
| 4.x     | Polish, testing, production readiness      | Planned     |

## Local Development Ports

| Service    | Host Port | Container Port |
|------------|-----------|----------------|
| Nginx      | 8080      | 80             |
| API        | 5000      | 5000           |
| Public Web | 3000      | 3000           |
| Admin      | 3001      | 3001           |
| PostgreSQL | 5434      | 5432           |

---

## Key Decisions Log

| Decision                          | Rationale                                           |
|-----------------------------------|-----------------------------------------------------|
| Modular monolith (not microservices) | Simpler ops for small team, easier debugging     |
| JSONB for sections                | Schema flexibility, avoids migration churn          |
| Customer-per-stack                | Data isolation, simple scaling model                |
| Nginx for uploads                 | Offloads static serving from API                    |
| Central Package Management        | Pinned versions in Directory.Packages.props + lock file |
| Pinned Docker images              | Exact version tags for reproducible builds          |
| NuGet locked-mode in Docker       | `--locked-mode` ensures CI/Docker matches lock file |
