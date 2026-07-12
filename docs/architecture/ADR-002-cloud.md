# ADR-002: Cloud Deployment Topology

## Status
Accepted

## Context
Auto-trading must run 24/7 without user device online.

## Decision

| Component | Service | URL |
|-----------|---------|-----|
| Web | Vercel | app.pulsefolio.io |
| API + Worker | Railway / Fly.io | api.pulsefolio.io |
| PostgreSQL | Neon | managed branch |
| Redis | Upstash | job queue + cache |
| DNS | Cloudflare | CNAME to Vercel/Railway |

## CI/CD
- PR → GitHub Actions lint/test
- merge main → auto-deploy staging
- tag release → promote prod

## Local dev
- docker-compose: Postgres + Redis
- API :8000, Web :3000

## Consequences
- ~$20–40/mo starting cost
- Secrets in Railway/Vercel env only
