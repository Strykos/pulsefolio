# Render deployment (free tier)

Deploy Pulsefolio web + API + Postgres on [Render](https://render.com) without local iPhone/Xcode setup.

## What gets deployed

| Service | Render name | Notes |
|---------|-------------|--------|
| FastAPI | `pulsefolio-api` | Docker, rule-based AI (no Ollama on cloud) |
| Next.js | `pulsefolio-web` | SSR dashboard |
| PostgreSQL | `pulsefolio-db` | Free DB (expires after 30 days on free plan) |

## One-time setup

1. **Push this repo to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial Pulsefolio deploy"
   gh repo create pulsefolio --public --source=. --push
   ```
   Or create an empty repo on GitHub and `git remote add origin … && git push -u origin main`.

2. **Render Dashboard** → **New** → **Blueprint**

3. Connect your **GitHub** account and select the `pulsefolio` repository.

4. Render reads `render.yaml` at the repo root and creates:
   - `pulsefolio-db`
   - `pulsefolio-api`
   - `pulsefolio-web`

5. Wait for all three services to finish building (first deploy ~5–10 min).

6. Open the **`pulsefolio-web`** URL (e.g. `https://pulsefolio-web.onrender.com`).

## Login

- **Email:** `demo@pulsefolio.app`
- **Password:** `demo12345`

The API seeds demo data on first startup.

## Environment (auto-wired by Blueprint)

| Variable | Set by |
|----------|--------|
| `DATABASE_URL` | Render Postgres |
| `SECRET_KEY` | Auto-generated |
| `CORS_ORIGINS` | Web service URL |
| `NEXT_PUBLIC_API_URL` | API service URL |
| `AI_PROVIDER=rules` | No local LLM required |

`NEXT_PUBLIC_WS_URL` is optional — the web app derives `wss://…/api/v1/stream` from the API URL.

## Free tier caveats

- Services **spin down** after ~15 min idle; first request may take 30–60s.
- Free Postgres **expires in 30 days** — upgrade or export data before then.
- **Ollama** does not run on Render; recommendations use deterministic rules + guardrails.

## Verify API

```bash
curl https://pulsefolio-api.onrender.com/api/v1/health
```

Replace host with your actual Render API URL.

## iOS after cloud deploy

Rebuild the iOS app with:

```
API_URL=https://pulsefolio-api.onrender.com
```

Or set that in Xcode scheme environment variables before **⌘R**.
