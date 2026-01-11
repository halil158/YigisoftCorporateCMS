# YigisoftCorporateCMS — Project Status

Last updated: 2026-01-11  
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

Verification note:
- If endpoints appear missing, check running version:
  - `GET /api/info` -> phase should match latest
- Force refresh containers when needed:
  - `docker compose down`
  - `docker compose up -d --build --force-recreate`

---

## Current State (Verified)

- `GET /api/info` returns phase: `1.3a`
- `POST /api/dev/seed` works
- `POST /api/dev/token` works (Development only)
- `GET /api/admin/pages` works with dev token and Admin role

---

## Next Planned Phase

### Phase 1.3b — Sections schema validation (registry)
Goal:
- Current validation only checks “sections is JSON array”.
- Add registry-based validation per section type.

Planned initial section types:
- `hero` (requires `data.title`)
- `features` (requires `data.items[]` and each item requires `title`)
- `cta` (requires `data.text`)

Rules:
- Unknown section type => 400
- Missing required fields => 400 with indexed detail messages
- Apply validation on admin create/update endpoints

Docs:
- Update `docs/architecture/overview.md`, `README.md`, `CHANGELOG.md`

---

## Phase Backlog (Future Ideas)

- Admin uploads API (multipart) -> save to `/uploads/...` (Admin-only)
- Sections “type registry” expansion and stronger schema typing
- Admin UI (React) consuming `/api/admin/*`
- Audit logs (who changed what)
- Rate limiting / basic security hardening
