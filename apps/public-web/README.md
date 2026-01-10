# Public Web App

## Purpose
Public-facing corporate website rendered from CMS content. Serves marketing pages, blog posts, and other visitor-facing content.

## Planned Role
- Fetches page data from the .NET API
- Renders section-based pages (block CMS approach)
- Optimized for SEO and fast load times

## Technical Notes
- **Framework:** React (Vite or Next.js - decision pending)
- **SSR/SEO:** To be determined in Phase 3. Options include:
  - Next.js with SSR/SSG
  - Vite + prerendering
  - Client-side only with meta injection
- **Routing:** Served at `/` via nginx

## Status
Placeholder - implementation begins in Phase 3.
