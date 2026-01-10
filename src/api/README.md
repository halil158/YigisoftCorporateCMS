# .NET API

## Purpose
Backend API serving all CMS functionality. Acts as the single source of truth for content, authentication, and business logic.

## Architecture
- **Style:** Modular monolith (vertical slices)
- **Framework:** .NET 10 Minimal API
- **Database:** PostgreSQL with EF Core

## Planned Modules
| Module       | Responsibility                                      |
|--------------|-----------------------------------------------------|
| Auth         | JWT authentication, user management                 |
| Pages        | Page CRUD, section JSONB storage                    |
| Sections     | Section type definitions, validation                |
| Media        | File upload, storage management                     |
| Settings     | Site configuration, customer settings               |

## Routing
- All endpoints prefixed with `/api`
- Served via nginx reverse proxy

## Status
Placeholder - implementation begins in Phase 1.
