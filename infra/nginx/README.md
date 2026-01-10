# Nginx Configuration

## Purpose
Reverse proxy and static file server for the CMS stack.

## Planned Routes

| Route        | Target                          | Notes                        |
|--------------|---------------------------------|------------------------------|
| `/`          | Public React app (port 3000)    | Main visitor-facing site     |
| `/admin`     | Admin React app (port 3001)     | Protected admin interface    |
| `/api/*`     | .NET API (port 5000)            | Backend API proxy            |
| `/uploads/*` | Static volume                   | User-uploaded media files    |

## Configuration Files
- `nginx.conf` - main configuration (to be created)
- `default.conf` - server block definitions (to be created)

## Status
Placeholder - configuration added in Phase 0.2.
