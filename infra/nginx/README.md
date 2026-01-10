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
- `conf.d/default.conf` - server block with reverse proxy rules

## Status
Active - reverse proxy routing implemented in Phase 0.2b.
