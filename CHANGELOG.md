# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Repository hygiene files (.gitignore, README.md, CHANGELOG.md)
- Monorepo folder structure (apps/, src/, infra/, docs/)
- Architecture overview document (docs/architecture/overview.md)
- Environment template (.env.example)
- Docker Compose with nginx and postgres services (Phase 0.2a)
- Nginx placeholder page at localhost:8080
- PostgreSQL with health check and persistent volume
- Public-web and admin placeholder services (Phase 0.2b)
- Nginx reverse proxy routing: `/` -> public-web, `/admin/` -> admin
- .NET 10 minimal API stub with `/health` and `/info` endpoints (Phase 0.2c1)
- API Dockerfile with multi-stage build
- Repository .dockerignore file
- API service in Docker Compose (Phase 0.2c2)
- Nginx reverse proxy routing: `/api/*` -> api:5000
- Serilog logging for API: console + rolling file sink (Phase 0.2c3)
- API logs persisted to `_data/logs/api/` on host
- Shared uploads volume mounted to nginx and API (Phase 0.3a)
- Nginx serves `/uploads/*` as static files with cache headers
- Standardized uploads mount path to `/uploads` in all containers (Phase 0.3b)
- EF Core with PostgreSQL integration (Phase 1.1a)
- Pages table with JSONB sections column
- Automatic migrations at startup (Development only)
- `/api/db-check` endpoint for database connectivity verification
