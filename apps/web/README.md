# Pulsefolio Web Dashboard

Next.js 15 trading dashboard for Pulsefolio paper trading.

## Quick start

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/dashboard`.

## Environment

Optional overrides in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/stream
```

When the API is unavailable, all pages fall back to mock data with a banner.

## Structure

```
apps/web/
├── public/                  # Static assets (favicon)
├── src/
│   ├── app/                 # App Router pages
│   │   ├── dashboard/       # Portfolio overview, charts, AI rec
│   │   ├── portfolio/       # Holdings by asset class
│   │   ├── trades/          # Pending approvals + history
│   │   ├── insights/        # AI decision log
│   │   └── settings/        # Theme, mode, risk, motion
│   ├── components/
│   │   ├── brand/           # BrandLogo, PaperTradingBadge, PulseLine
│   │   ├── chrome/          # LiveIndicator
│   │   ├── data/            # AnimatedValue, RiskScoreGauge, charts
│   │   ├── trading/         # DecisionCard, ModeToggle, TradeCelebration
│   │   ├── settings/        # ThemeSwitcher
│   │   ├── layout/          # Sidebar, MobileNav, AppShell
│   │   └── ui/              # Card
│   ├── lib/                 # API client, WebSocket, themes, mock data
│   └── providers/           # Theme + WebSocket context
└── package.json
```

## Themes

Four themes from `packages/design-tokens` — switch in Settings:

| Theme | Default | Mood |
|-------|---------|------|
| Midnight | ✓ | Premium fintech, dark |
| Aurora | | Energetic, optimistic |
| Paper | | Clean, daytime |
| Terminal | | Retro trader |

## API endpoints (expected)

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/v1/dashboard` | Dashboard |
| GET | `/api/v1/portfolio` | Portfolio |
| GET | `/api/v1/trades` | Trades |
| GET | `/api/v1/insights` | AI Insights |
| GET | `/api/v1/settings` | Settings |
| POST | `/api/v1/trades/:id/approve` | Trade approval |
| POST | `/api/v1/recommendations/dismiss` | Dismiss AI rec |
| WS | `/api/v1/stream` | Live price/portfolio updates |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
