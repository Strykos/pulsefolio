# Pulsefolio

**Every beat of your portfolio, decoded.**

AI-powered paper trading across stocks, ETFs, bonds, crypto, and commodities — balanced for risk-adjusted growth.

## Monorepo structure

```
pulsefolio/
├── apps/
│   ├── ios/          # SwiftUI native app
│   └── web/          # Next.js dashboard → Vercel
├── services/
│   ├── api/          # FastAPI → Railway
│   └── worker/       # Auto-trade worker (24/7 cloud)
├── packages/
│   ├── design-tokens/
│   └── shared-types/
├── docs/
├── agents/           # Cursor agent prompt templates (see AGENTS.md)
├── AGENTS.md         # Agent steering — mockup-first + QA gates
└── infra/
```

## Quick start (local)

### API
```bash
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Local AI (free)

Pulsefolio uses Ollama with `qwen3:4b`. Recommendations are generated locally;
portfolio data is not sent to a hosted model.

```bash
open -a Ollama
ollama pull qwen3:4b
```

The API falls back to deterministic recommendation rules when Ollama is
unavailable. Configuration is documented in `services/api/.env.example`.

### Web
```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000

### Worker (optional)
```bash
cd services/worker
pip install -r requirements.txt -r ../api/requirements.txt
PYTHONPATH=../api python main.py
```

### Docker
```bash
docker compose up
```

## Demo account
- Email: `demo@pulsefolio.app`
- Password: `demo12345`
- Dashboard endpoints work without auth for local demo (`/api/v1/dashboard`)

## Cloud deployment
See [docs/architecture/cloud-provisioning.md](docs/architecture/cloud-provisioning.md) and [docs/architecture/render-deploy.md](docs/architecture/render-deploy.md).

| Service | URL |
|---------|-----|
| Web + API (Render free tier) | Blueprint: `render.yaml` |
| Web (alt) | app.pulsefolio.io (Vercel) |
| API (alt) | api.pulsefolio.io (Railway) |

## Features (v1)
- Multi-asset simulated trading
- AI recommendations with risk/return impact
- Manual + auto-mode (cloud worker)
- 4 themes, live WebSocket updates
- Risk engine with guardrails
- iOS + web clients

## Agent workflow
See `agents/` for PM, Architect, Developer, Tester, CI/CD prompt templates.
