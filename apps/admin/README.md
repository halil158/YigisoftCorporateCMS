# Admin Panel

React-based administration interface for YigisoftCorporateCMS.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Routing:** React Router v6
- **Auth:** JWT tokens stored in localStorage

## Development

```bash
# Install dependencies
npm install

# Start dev server (with API proxy to localhost:8080)
npm run dev

# Build for production
npm run build
```

## Docker

The admin panel is containerized with a multi-stage build:
1. **Build stage:** Node.js builds the Vite app
2. **Production stage:** nginx serves the static files with SPA routing

```bash
# Build and run via docker compose (from repo root)
docker compose up -d --build admin
```

## Routes

| Path | Description |
|------|-------------|
| `/admin/login` | Login page |
| `/admin/` | Dashboard (protected) |

## Configuration

- **Base path:** `/admin/` (configured in `vite.config.ts`)
- **API proxy:** Requests to `/api/*` are proxied during local dev
- **SPA routing:** nginx serves `index.html` for all routes (try_files fallback)

## Status

Phase 2.0 complete. Future phases will add:
- Pages management UI (Phase 2.1)
- Media library UI (Phase 2.2)
