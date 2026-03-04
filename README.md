# Musaed

Monorepo for Musaed applications: prototype, website, and future frontend/backend services.

## Structure

```
apps/
  prototype/   # Vite + React app
  website/     # Next.js app
docs/
  DEPLOYMENT.md  # Deployment guide (GCP, GitHub pipeline, environments)
```

## Quick Start

```bash
pnpm install
pnpm dev:prototype   # or pnpm dev:website
```

## Deployment

Deployments run via GitHub Actions to Google Cloud Run. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for:

- GCP setup (project, Artifact Registry, Cloud Run)
- GitHub secrets configuration
- Branch-to-environment mapping (UAT from `uat`, Prod from `main`)
- Change detection (only changed apps are deployed)
- Adding new apps
