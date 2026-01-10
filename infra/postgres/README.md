# PostgreSQL Configuration

## Purpose
Primary data store for all CMS content, user accounts, and application state.

## Data Storage
- **Volume Path:** `./data/postgres` (mounted in docker-compose)
- **Persistence:** Data survives container restarts via named volume

## Migration Ownership
- Migrations are managed by the .NET API project using EF Core
- Database schema changes flow through `src/api` migration files
- Never modify schema directly in PostgreSQL

## Initialization
- `init.sql` (optional) - seed scripts for development (to be created if needed)

## Status
Placeholder - docker-compose integration in Phase 0.2.
