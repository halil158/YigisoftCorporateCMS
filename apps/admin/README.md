# Admin Panel

## Purpose
Internal administration interface for managing CMS content, pages, sections, media, and site settings.

## Planned Role
- Authenticated access only (JWT-based auth)
- Page builder UI with drag-and-drop section management
- Media library for uploads
- Site configuration management

## Technical Notes
- **Framework:** React (Vite)
- **Auth:** JWT tokens issued by .NET API
- **Section Builder:** Visual editor for composing pages from predefined section types
- **Routing:** Served at `/admin` via nginx

## Status
Placeholder - implementation begins in Phase 2.
