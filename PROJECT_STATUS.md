# YigisoftCorporateCMS — Project Status

Last updated: 2026-01-12  
Timezone: Europe/Istanbul

## Overview

Monorepo corporate website CMS with:
- nginx reverse proxy (single entrypoint: http://localhost:8080)
- .NET 10 Minimal API
- PostgreSQL
- React frontend planned later (currently placeholders)

Key repo rules:
- `_data/` is gitignored (holds logs/uploads/db volumes as applicable)
- Use reproducible builds: pinned images + NuGet lock restore in Docker

---

## Runtime & Routing

### Single entrypoint (nginx)
- `GET /health` -> `OK`
- `/` -> public placeholder
- `/admin/` -> admin placeholder
- `/api/*` -> proxied to API service
- `/uploads/*` -> served from host `_data/uploads` (cache headers)

### Ports
- nginx: `8080` (host)
- Postgres: `5434` (host, default; configurable)

### Persistence
- API logs: `_data/logs/api`
- uploads: `_data/uploads`

---

## Completed Phases

### Phase 0 — Infrastructure & Scaffold

#### Phase 0.1 — Monorepo scaffold
- Added `README.md`, `CHANGELOG.md`, `docs/architecture/overview.md`, `.env.example`

#### Phase 0.2a — Docker Compose base
- `docker-compose.yml` with nginx + postgres + placeholders

#### Phase 0.2b — nginx routing
- `/` -> public placeholder
- `/admin/` -> admin placeholder
- `/health` -> OK

#### Phase 0.2c1 — API stub
- .NET 10 API container + `/health` + `/info` + Dockerfile

#### Phase 0.2c2 — nginx proxies `/api/`
- API reachable via `/api/*` and also root routes as configured

#### Phase 0.2c3 — Serilog
- Logs to stdout + rolling files
- Host volume: `_data/logs/api` -> `/app/logs`
- Retention: 14 days

#### Phase 0.3a — uploads static serving
- nginx serves `/uploads/*` from host `_data/uploads`

#### Phase 0.3b — standardized uploads path
- unified `/uploads` path for nginx + api

---

## Backend

### Phase 1.1a — EF Core + Postgres + pages table
Pages schema:
- `id uuid primary key default gen_random_uuid()`
- `slug text unique`
- `title text`
- `meta_title text?`
- `meta_description text?`
- `sections jsonb not null default '[]'`
- `is_published boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### Phase 1.1b* — EF config pattern + pgcrypto
- Mappings moved to `Data/Configurations` with `ApplyConfigurationsFromAssembly`
- pgcrypto enabled (migration + initial guard)
- Migrations auto-apply in Development (Docker env fixed)

### Phase 1.1c — Public page API + dev seed
- `POST /api/dev/seed` (Development only)
  - Upserts "home" page with sections: hero/features/cta
  - Publishes it
- `GET /api/pages/{slug}`
  - Returns only published pages

---

## Auth

### Phase 1.2a1 — JWT pipeline
- JWT Bearer auth configured
- `GET /api/auth/me` protected

### Phase 1.2a1.1 — Central Package Management
- `Directory.Packages.props` pins exact NuGet versions
- `src/api/packages.lock.json` generated and used

### Phase 1.2a1.2 — Reproducible infra
- Docker images pinned (nginx/postgres/.NET base images)
- Docker restore uses: `dotnet restore --locked-mode`
- `Directory.Build.props` enables lock file generation

### Phase 1.2a2 — Normalized auth tables
Tables:
- `users` (accounts)
- `claims` (type/value pairs; example: type=`role`, value=`Admin`)
- `user_claims` (junction)

Features:
- PBKDF2-SHA256 password hashing
- `POST /api/auth/login` issues JWT and includes role claims
- Dev seed creates admin user + Admin role claim
- Production signing key enforcement: non-Development cannot use placeholder/missing/short signing key (fail fast)

Migration cleanup:
- Renamed misleading migration `AddAdminUsers` -> `AddAuthTables` (same schema)

Build fix:
- Fixed C# compile error (CS8115) by replacing `??= throw` with explicit guard.

---

## Admin Pages CRUD

### Phase 1.3a — Admin-only CRUD endpoints
- Admin route group requires role `Admin` via JWT claims
- Endpoints under `/api/admin/pages`:
  - list/get/create/update/delete
  - publish/unpublish
- Validation:
  - slug pattern: lowercase alnum with hyphens only
  - title required max 200 chars
  - sections must be valid JSON array
- slug uniqueness returns 409 conflict
- Serilog logs for create/update/delete/publish

### Phase 1.3b — Sections schema validation (registry)
- Registry-based validation for section types: hero, features, cta
- Each section must have `type` (string) and `data` (object)
- Hero requires `data.title`; optional: `subtitle`, `imageUrl`, `primaryCta`
- Features requires `data.title`, `data.items` (array, min 1); items require `title`
- CTA requires `data.title`, `data.buttonText`, `data.buttonUrl`
- Unknown section types return 400 with list of supported types
- Validation errors include detailed paths: `sections[0].data.title is required`
- Error format: `{ error: "ValidationFailed", details: [...] }`

### Phase 1.4a — Admin uploads API
- `POST /api/admin/uploads` (Admin role required)
- Accepts multipart/form-data with `file` field
- Saves to `/uploads/{yyyy}/{MM}/{guid}.{ext}`
- Allowed extensions: .png, .jpg, .jpeg, .webp, .svg, .pdf
- Max file size: 10 MB
- Returns 201 with `{ url, fileName, contentType, size }`
- Nginx serves `/uploads/*` directly with cache headers
- Fixed dev seed sections JSON to match section schemas (1.3b consistency)

### Phase 1.4b — Program.cs bootstrap refactor
- Refactored Program.cs into focused bootstrap modules:
  - `Bootstrap/ApiLoggingBootstrap.cs` - Serilog configuration
  - `Bootstrap/ApiServicesBootstrap.cs` - Service registrations
  - `Bootstrap/ApiAppBootstrap.cs` - App pipeline wiring
- Program.cs now a thin composition root (~30 lines)
- No behavior change; SOLID-friendly structure

### Phase 1.5a — Swagger/OpenAPI (Development only)
- Swagger UI at `/api/swagger` (Development only)
- OpenAPI JSON at `/api/swagger/v1/swagger.json`
- JWT Bearer security scheme for "Authorize" button
- Added Swashbuckle.AspNetCore 7.2.0
- Not exposed in Production environment

### Phase 1.5b — Uploads metadata and management
Schema:
- `uploads` table with FK to `users`
- Columns: id, storage_path, url, file_name, original_file_name, content_type, size, created_at, uploaded_by_user_id

Endpoints:
- POST `/api/admin/uploads` - now returns `id` and persists to DB
- GET `/api/admin/uploads?take=N` - list uploads (default 50, max 200)
- DELETE `/api/admin/uploads/{id}` - delete DB record + file from disk

### Phase 1.6a — Rate limiting + Documentation
Documentation:
- README Uploads section improved:
  - PS7+ examples using `-Form` parameter
  - PS5.1 examples using `curl.exe` (Windows PowerShell 5.1 lacks `-Form`)
  - Inline test.png generation (base64 1x1 PNG)
  - Bash/Linux examples reorganized

Rate limiting:
- POST `/api/auth/login` - 5 requests/min per client IP
- POST `/api/admin/uploads` - 30 requests/min per client IP
- 429 JSON response: `{ error: "RateLimited", message: "Too many requests", retryAfterSeconds: N }`
- Uses built-in Microsoft.AspNetCore.RateLimiting

Real client IP behind nginx:
- Forwarded headers middleware enabled (`UseForwardedHeaders`)
- nginx already sets X-Forwarded-For, X-Real-IP, X-Forwarded-Proto
- `KnownIPNetworks.Clear()` trusts Docker network proxies

Program.cs remains minimal (~30 lines, SOLID-friendly)

Verification note:
- If endpoints appear missing, check running version:
  - `GET /api/info` -> phase should match latest
- Force refresh containers when needed:
  - `docker compose down`
  - `docker compose up -d --build --force-recreate`

---

## Current State (Verified)

- `GET /api/info` returns phase: `1.6a`
- `POST /api/dev/seed` works
- `POST /api/dev/token` works (Development only)
- `GET /api/admin/pages` works with dev token and Admin role
- `POST /api/admin/uploads` works with dev token and Admin role (PS5.1 via curl.exe, PS7+ via -Form)
- `GET /api/admin/uploads` works with dev token and Admin role
- `DELETE /api/admin/uploads/{id}` works with dev token and Admin role
- Swagger UI at `/api/swagger` works (Development only)
- Rate limiting: spam login/uploads triggers 429 with JSON response
- `/api/health` and `/api/info` unaffected by rate limits

---

## Planned Phases (Roadmap)

### Phase 1.6b — Section registry expansion
Strengthen schema typing and add new section types.
- Add `testimonials`, `gallery`, `contact-form` section validators
- Typed C# models for section data (replace anonymous objects)
- JSON Schema generation for frontend validation

### Phase 1.6c — Integration tests
Automated API testing with test containers.
- xUnit test project with WebApplicationFactory
- Testcontainers for PostgreSQL
- Cover auth, pages CRUD, uploads, rate limiting
- CI pipeline integration (GitHub Actions)

### Phase 2.0 — Admin UI scaffold (React)
Bootstrap the admin panel with auth flow.
- Vite + React + TypeScript setup
- React Router for navigation
- Login page + JWT token storage
- Protected route wrapper
- Basic layout (sidebar, header, content area)

### Phase 2.1 — Admin Pages UI
Full pages management interface.
- Pages list with search/filter
- Page editor with section builder
- Drag-and-drop section reordering
- Publish/unpublish toggle
- Slug auto-generation from title

### Phase 2.2 — Admin Uploads UI
Media library for file management.
- Upload dropzone with progress
- Grid/list view of uploads
- Delete with confirmation
- Copy URL to clipboard
- Image preview modal

### Phase 3.0 — Public Web scaffold
Visitor-facing website foundation.
- Vite + React + TypeScript setup
- Fetch pages from API by slug
- Section renderer component registry
- 404 page handling

### Phase 3.1 — SEO + routing + caching
Production-ready public site.
- React Helmet for meta tags
- Server-side rendering or static generation
- nginx cache headers for pages
- Sitemap.xml generation
- robots.txt configuration

---

## Phase Backlog (Future Ideas)

- Audit logs (who changed what)
- Additional security hardening (CORS, CSRF, etc.)
- Multi-language support (i18n)
- Page versioning / revision history
- Scheduled publishing
