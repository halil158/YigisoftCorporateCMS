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

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/health`               | Health check                         |
| GET    | `/api/info`                 | API version and phase info           |
| GET    | `/api/db-check`             | Database connectivity check          |
| GET    | `/api/pages/{slug}`         | Get published page by slug           |
| POST   | `/api/pages/{slug}/contact` | Submit contact form (rate limited)   |
| POST   | `/api/auth/login`           | Authenticate and get JWT token       |
| GET    | `/api/auth/me`              | Get authenticated user info (protected) |
| POST   | `/api/dev/seed`             | Seed sample data (Development only)  |
| POST   | `/api/dev/token`            | Generate JWT token (Development only)|

### Swagger / OpenAPI (Development only)

| Route                              | Description                          |
|------------------------------------|--------------------------------------|
| `/api/swagger`                     | Swagger UI                           |
| `/api/swagger/v1/swagger.json`     | OpenAPI 3.0 specification            |

**Note:** Swagger is only available when `ASPNETCORE_ENVIRONMENT=Development`. Not exposed in Production.

### Admin Endpoints (require Admin role)

| Method | Endpoint                                       | Description                     |
|--------|------------------------------------------------|---------------------------------|
| GET    | `/api/admin/pages`                             | List all pages                  |
| GET    | `/api/admin/pages/{id}`                        | Get page by ID                  |
| POST   | `/api/admin/pages`                             | Create page                     |
| PUT    | `/api/admin/pages/{id}`                        | Update page                     |
| DELETE | `/api/admin/pages/{id}`                        | Delete page                     |
| POST   | `/api/admin/pages/{id}/publish`                | Publish page                    |
| POST   | `/api/admin/pages/{id}/unpublish`              | Unpublish page                  |
| POST   | `/api/admin/uploads`                           | Upload file (multipart/form-data) |
| GET    | `/api/admin/uploads`                           | List uploads                    |
| DELETE | `/api/admin/uploads/{id}`                      | Delete upload                   |
| GET    | `/api/admin/contact-messages`                  | List contact messages (filter: pageSlug, processed, skip, take) |
| GET    | `/api/admin/contact-messages/{id}`             | Get contact message by ID       |
| PATCH  | `/api/admin/contact-messages/{id}/mark-processed` | Mark message as processed    |

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

### Sections Type Registry

Section types are validated at the API layer using a registry pattern. Each section type has a validator that enforces required fields and data types.

**Supported section types:**

| Type | Required Fields | Optional Fields |
|------|-----------------|-----------------|
| `hero` | `data.title` | `data.subtitle`, `data.imageUrl`, `data.primaryCta` (object with `text`, `url`) |
| `features` | `data.title`, `data.items` (array, min 1) | Items: `description`, `icon` |
| `cta` | `data.title`, `data.buttonText`, `data.buttonUrl` | — |
| `testimonials` | `data.title`, `data.items` (array, min 1); Items: `quote`, `name` | Items: `role`, `company`, `avatarUrl` |
| `gallery` | `data.title`, `data.items` (array, min 1); Items: `imageUrl` | Items: `alt`, `caption` |
| `contact-form` | `data.title`, `data.recipientEmail`, `data.fields` (array, min 1); Fields: `name`, `label`, `type` | `data.description`, `data.submitText`; Fields: `required`, `placeholder` |

**Validation behavior:**
- Unknown section types return 400 with list of supported types
- Missing required fields return 400 with detailed paths (e.g., `sections[0].data.title is required`)
- Validation errors include all detected issues in a single response

**Extensibility:** New section types can be added by implementing a validator function and registering it in `SectionsValidator.TypeValidators` dictionary (`src/api/Validation/Sections/SectionsValidator.cs`).

---

## Uploads Handling

1. **Upload endpoint:** `POST /api/admin/uploads` (Admin role required)
2. **Upload flow:** Admin panel → API → saves to shared volume → returns public URL
3. **Storage:** `_data/uploads/` on host, mounted at `/uploads` in both API and Nginx containers
4. **Serving:** Nginx directly serves `/uploads/*` for performance (with 7-day cache headers)
5. **Path format:** `/uploads/{yyyy}/{MM}/{guid}.{ext}`

**Upload constraints:**
- Max file size: 10 MB
- Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.pdf`

**Response (201 Created):**
```json
{
  "url": "/uploads/2026/01/a1b2c3d4-5678-90ab-cdef-1234567890ab.png",
  "fileName": "a1b2c3d4-5678-90ab-cdef-1234567890ab.png",
  "contentType": "image/png",
  "size": 12345
}
```

**Note:** Create `_data/uploads/` manually before first run (folder is gitignored).

---

## Contact Form Submissions

Public endpoint for visitors to submit contact forms on published pages with `contact-form` sections.

### Contact Messages Table Schema

| Column           | Type          | Constraints                    |
|------------------|---------------|--------------------------------|
| id               | uuid          | PK, default gen_random_uuid() |
| page_slug        | text          | required, indexed              |
| recipient_email  | text          | required                       |
| fields           | jsonb         | required                       |
| created_at       | timestamptz   | default now()                  |
| ip               | text          | nullable                       |
| user_agent       | text          | nullable                       |
| processed_at     | timestamptz   | nullable, indexed              |

### Submission Flow

1. **Endpoint:** `POST /api/pages/{slug}/contact`
2. **Requirements:**
   - Page must exist and be published
   - Page must have a `contact-form` section
3. **Validation:**
   - Only fields defined in the section's `fields` array are allowed
   - Required fields (field.required = true) must have non-empty values
   - Email fields must contain `@` and no spaces
   - Phone fields allow digits, spaces, +, -, (), .
4. **Storage:** Message saved with page slug, recipient email from section, and submitted fields as JSON
5. **Rate limit:** 10 requests per hour per IP

**Response (202 Accepted):**
```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "createdAt": "2026-01-12T10:30:00Z"
}
```

---

## Authentication

**JWT Bearer authentication with normalized user/claims tables:**

### JWT Settings

| Setting         | Default Value            | Description                         |
|-----------------|--------------------------|-------------------------------------|
| `Jwt:Issuer`    | YigisoftCorporateCMS     | Token issuer claim                  |
| `Jwt:Audience`  | YigisoftCorporateCMS     | Token audience claim                |
| `Jwt:SigningKey`| (dev placeholder)        | HMAC-SHA256 signing key (min 32 chars) |

**Configuration:** Settings can be overridden via environment variables (`Jwt__Issuer`, `Jwt__Audience`, `Jwt__SigningKey`).

**Production enforcement:** In non-Development environments, SigningKey must be at least 32 characters and NOT the dev placeholder.

### Users Table Schema

| Column           | Type          | Constraints                    |
|------------------|---------------|--------------------------------|
| id               | uuid          | PK, default gen_random_uuid() |
| email            | text          | required                       |
| email_normalized | text          | unique index, required         |
| display_name     | text          | required                       |
| password_hash    | text          | required (PBKDF2-SHA256)       |
| is_active        | boolean       | default true                   |
| created_at       | timestamptz   | default now()                  |
| updated_at       | timestamptz   | default now()                  |

### Claims Table Schema

| Column           | Type          | Constraints                    |
|------------------|---------------|--------------------------------|
| id               | uuid          | PK, default gen_random_uuid() |
| type             | text          | required                       |
| value            | text          | required                       |
| created_at       | timestamptz   | default now()                  |

**Unique constraint:** (type, value) - ensures no duplicate claims.

### User_Claims Table Schema (Junction)

| Column           | Type          | Constraints                    |
|------------------|---------------|--------------------------------|
| user_id          | uuid          | PK (composite), FK -> users    |
| claim_id         | uuid          | PK (composite), FK -> claims   |

**Relationships:** Many-to-many between users and claims. Cascade delete on both FKs.

### Auth Endpoints

| Method | Endpoint          | Description                                |
|--------|-------------------|--------------------------------------------|
| POST   | `/api/auth/login` | Authenticate with email/password, get JWT  |
| GET    | `/api/auth/me`    | Get authenticated user info (protected)    |

**Development-only:** `POST /api/dev/token` generates a test JWT (dev-admin, Admin role, 60-min expiry).

---

## Rate Limiting

Built-in rate limiting using `Microsoft.AspNetCore.RateLimiting` to protect against brute-force attacks and abuse.

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| POST `/api/auth/login` | 5 requests | 1 minute | Client IP |
| POST `/api/admin/uploads` | 30 requests | 1 minute | Client IP |
| POST `/api/pages/{slug}/contact` | 10 requests | 1 hour | Client IP |

**429 Response Format:**
```json
{
  "error": "RateLimited",
  "message": "Too many requests",
  "retryAfterSeconds": 60
}
```

**Real Client IP behind nginx:**
- Forwarded headers middleware enabled (`UseForwardedHeaders`)
- nginx sets `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Proto`
- `KnownIPNetworks.Clear()` trusts all proxies in Docker network

**Unaffected endpoints:** `/api/health`, `/api/info` have no rate limits.

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
| 1.2a2   | Normalized auth tables + login endpoint    | Done        |
| 1.3a    | Admin Pages CRUD endpoints                 | Done        |
| 1.3b    | Sections schema validation (type registry) | Done        |
| 1.4a    | Admin uploads API (multipart)              | Done        |
| 1.4b    | Program.cs bootstrap refactor              | Done        |
| 1.5a    | Swagger/OpenAPI (Development only)         | Done        |
| 1.5b    | Uploads metadata persistence + management  | Done        |
| 1.6a    | Rate limiting + real client IP behind nginx| Done        |
| 1.6b    | Section registry expansion (testimonials, gallery, contact-form) | Done |
| 1.7a    | Contact form submissions (store in DB)     | Done        |
| 1.7b    | Contact messages admin filtering + pagination | Done     |
| 1.8a    | Composition root refactor (SOLID)          | Done        |
| 1.8b    | Integration tests + CI (Testcontainers)    | Done        |
| 1.x     | Backend core (auth, pages, sections, API)  | In Progress |
| 2.x     | Admin panel (section builder, media)       | Planned     |
| 3.x     | Public web (rendering, SEO)                | Planned     |
| 4.x     | Polish, testing, production readiness      | Planned     |

## Local Development Ports

| Service    | Host Port | Notes                              |
|------------|-----------|------------------------------------|
| Nginx      | 8080      | Reverse proxy for all HTTP traffic |
| PostgreSQL | 5434      | Direct DB access for dev tools     |

**Note:** API, public-web, and admin are accessed through Nginx (no separate host ports).

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
| Normalized auth tables            | Users/claims/user_claims for flexible RBAC          |
