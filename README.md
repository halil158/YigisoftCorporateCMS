# YigisoftCorporateCMS

A modular corporate website content management system with a section-based page builder, running on Docker.

## Tech Stack

| Layer       | Technology                |
|-------------|---------------------------|
| Frontend    | React (Public + Admin)    |
| Backend     | .NET 10 Web API           |
| Database    | PostgreSQL                |
| Proxy       | Nginx                     |
| Container   | Docker / Docker Compose   |

## Repository Layout

```
YigisoftCorporateCMS/
├── src/
│   ├── Api/              # .NET 10 Web API
│   ├── Web.Public/       # React public-facing site
│   └── Web.Admin/        # React admin panel
├── docker/               # Dockerfiles and compose configs
├── nginx/                # Nginx configuration
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── tests/                # Test projects
```

## Planned Nginx Routes

| Route              | Target                  |
|--------------------|-------------------------|
| `/`                | Public React app        |
| `/admin`           | Admin React app         |
| `/api/*`           | .NET API                |
| `/uploads/*`       | Static file storage     |

## Development

> **TODO:** Development setup instructions will be added here.

## License

See [LICENSE](LICENSE) for details.
