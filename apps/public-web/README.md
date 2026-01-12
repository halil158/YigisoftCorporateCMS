# Public Web App

## Purpose
Public-facing corporate website rendered from CMS content. Serves marketing pages and other visitor-facing content.

## Features (Phase 3.0)
- Fetches published page data from the .NET API by slug
- Renders section-based pages dynamically
- Supported section types: hero, features, cta, testimonials, gallery, contact-form
- SEO meta tags (title, description) from CMS data
- Contact form submission with validation
- Responsive design with Tailwind CSS

## Technical Stack
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6 (client-side)
- **API:** Fetch to `/api/pages/{slug}`

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Routing
- `/` - Redirects to `/home`
- `/:slug` - Dynamic page route (fetches from API)
- Unknown slugs show 404 page

## API Endpoints Used
- `GET /api/pages/{slug}` - Fetch published page by slug
- `POST /api/pages/{slug}/contact` - Submit contact form

## Section Types
| Type | Description |
|------|-------------|
| hero | Large header with title, subtitle, image, and CTA button |
| features | Grid of feature cards with icons |
| cta | Call-to-action banner with button |
| testimonials | Customer quotes with avatar |
| gallery | Image grid with captions |
| contact-form | Dynamic form with configurable fields |

## Production Deployment
The built files should be served from the root path (`/`). Configure nginx to:
1. Serve static assets from `dist/`
2. Proxy `/api/*` to the backend
3. Return `index.html` for all other routes (SPA fallback)
