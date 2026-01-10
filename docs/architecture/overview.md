# Architecture Overview

## Stack Summary

| Component      | Technology                  | Purpose                              |
|----------------|-----------------------------|--------------------------------------|
| Container      | Docker / Docker Compose     | Deployment and local development     |
| Proxy          | Nginx                       | Routing, static files, SSL           |
| Public Web     | React                       | Visitor-facing website               |
| Admin Panel    | React                       | Content management interface         |
| API            | .NET 10 (Minimal API)       | Backend services, business logic     |
| Database       | PostgreSQL                  | Persistent data storage              |

---

## Deployment Approach

**Customer-per-stack model:**
- Each customer runs their own isolated Docker Compose stack
- Stacks are independent: separate containers, database, and volume storage
- Enables per-customer customization and data isolation
- Scaling: horizontal via multiple stacks, not shared infrastructure

```
Customer A                    Customer B
┌─────────────────────┐      ┌─────────────────────┐
│ nginx               │      │ nginx               │
│ public-web          │      │ public-web          │
│ admin               │      │ admin               │
│ api                 │      │ api                 │
│ postgres            │      │ postgres            │
└─────────────────────┘      └─────────────────────┘
```

---

## Routing

Nginx handles all inbound traffic and routes to appropriate services:

| Route          | Target                  | Description                          |
|----------------|-------------------------|--------------------------------------|
| `/`            | public-web:80           | Public corporate website             |
| `/admin/`      | admin:80                | Admin panel (authenticated)          |
| `/api/*`       | api:5000                | Backend API endpoints (planned)      |
| `/uploads/*`   | Static volume           | User-uploaded media files (planned)  |

---

## Data Model Approach

**Block-based CMS with JSONB sections:**

Pages are stored with their content as structured JSONB, enabling flexible section-based composition.

```
Page
├── id, slug, title, meta
└── sections: JSONB[]
    ├── { type: "hero", data: { ... } }
    ├── { type: "features", data: { ... } }
    └── { type: "cta", data: { ... } }
```

**Benefits:**
- Flexible section types without schema migrations
- Fast reads (single query per page)
- Section data validated at API layer

---

## Uploads Handling

1. **Upload flow:** Admin panel → API → saves to shared volume
2. **Storage:** `/uploads` volume mounted in both API and Nginx containers
3. **Serving:** Nginx directly serves `/uploads/*` for performance
4. **Path format:** `/uploads/{year}/{month}/{filename}`

---

## Development Phases

| Phase   | Focus                                      | Status      |
|---------|--------------------------------------------|-------------|
| 0.1     | Repo scaffold, architecture docs           | Done        |
| 0.2a    | Docker Compose base (nginx + postgres)     | Done        |
| 0.2b    | Nginx routing + placeholder services       | Done        |
| 0.2c1   | .NET 10 API stub + Dockerfile              | Done        |
| 0.2c2   | API in Docker Compose + nginx routing      | Planned     |
| 1.x     | Backend core (auth, pages, sections, API)  | Planned     |
| 2.x     | Admin panel (section builder, media)       | Planned     |
| 3.x     | Public web (rendering, SEO)                | Planned     |
| 4.x     | Polish, testing, production readiness      | Planned     |

## Local Development Ports

| Service    | Host Port | Container Port |
|------------|-----------|----------------|
| Nginx      | 8080      | 80             |
| API        | 5000      | 5000           |
| Public Web | 3000      | 3000           |
| Admin      | 3001      | 3001           |
| PostgreSQL | (internal)| 5432           |

---

## Key Decisions Log

| Decision                          | Rationale                                           |
|-----------------------------------|-----------------------------------------------------|
| Modular monolith (not microservices) | Simpler ops for small team, easier debugging     |
| JSONB for sections                | Schema flexibility, avoids migration churn          |
| Customer-per-stack                | Data isolation, simple scaling model                |
| Nginx for uploads                 | Offloads static serving from API                    |
