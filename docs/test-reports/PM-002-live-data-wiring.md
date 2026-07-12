# PM-002 — Live Data Wiring Status Report

**Role:** Project Manager  
**Date:** 2026-07-11  
**Trigger:** User request — remove all simulations, wire real data everywhere  
**Tester gate:** TR-012 (pending)

---

## Executive summary

**Simulated client fallbacks and mock market data have been removed.** The stack now uses **Yahoo Finance live quotes** for pricing, **Ollama qwen3:4b** for AI recommendations, and **real portfolio DB state** for valuations. Clients show errors when the API is down instead of injecting static fiction.

| Area | Before | After |
|------|--------|-------|
| Market prices | Random walk on hardcoded bases | Yahoo Finance (`query1.finance.yahoo.com`) |
| Sparkline | Sine/cosine synthetic curve | Portfolio NAV from Yahoo 1mo daily closes |
| Day change | 10% of unrealized P&L | Real prior-close portfolio delta |
| Web offline | Static `mock-data.ts` ($124K) | Error banner, no fake numbers |
| Decision page | `decisionReviewScenario` ($46K VTI) | Live API only or empty state |
| iOS briefing | Frozen `OptionBMockupLayoutData` | `OptionBBriefingScreen` + live API |
| AI generate | Forced VTI/10 demo on HOLD | Real `ai_service.generate()` only |
| Auto-trade worker | Not running | Running (0 users in auto mode) |

---

## What is live now

### API (`services/api`)
- `YahooMarketDataAdapter` — real quotes for AAPL, MSFT, VTI, BND, BTC-USD, ETH-USD, GLD
- `portfolio_metrics.py` — sparkline + day change from Yahoo history × positions
- Ollama pipeline trusts model HOLD (no rules override)
- Demo forced-rebalance path disabled on public generate

### Web (`apps/web`)
- `api.ts` — returns `null` on failure, never static mocks
- All pages — loading/error state when API unavailable
- `/decision` — no curated scenario fallback

### iOS (`apps/ios`)
- Briefing tab uses `OptionBBriefingScreen` with `api.refreshAll()`
- `APIClient` — no `MockData` fallback; `loadError` on failure
- `generateAIAnalysis()` — no hardcoded VTI/10 body

---

## What remains (not simulation, but not “production complete”)

| Item | Status | Notes |
|------|--------|-------|
| Demo user seed | Intentional | `demo@pulsefolio.app` + seeded positions — real DB, live prices |
| Public `/api/v1/public/*` routes | Intentional | No auth yet; always demo user context |
| Decision evidence charts | Partial | Some decorative series still derived client-side from scalars |
| UI engine branding | Cosmetic | “Llama 3 70B” label when Ollama used |
| Auth-scoped portfolios | Not built | Web/iOS don't use authenticated portfolio endpoints |
| iOS mockup layout files | Dormant | `OptionBMockupLayoutData` still in repo but not routed |

---

## Services required

| Service | Port | Purpose |
|---------|------|---------|
| API | 8000 | Portfolio + AI + Yahoo quotes |
| Ollama | 11434 | `qwen3:4b` recommendations |
| Web | 3000 | Observatory UI |
| Worker | background | Auto-trade (when enabled) |

---

## Verification

- API tests: **10/10 pass** (with test stub for Yahoo offline)
- Live dashboard sample: **~$189K**, day change **+2.26%**, engine **ollama/qwen3:4b**
- Tester report: `docs/test-reports/TR-012-live-data-no-simulation.md`

---

## Recommendation

**Safe to use for live paper-trading demo** when API + Ollama are running.  
**Not ready for production** until auth, user-scoped portfolios, and remaining decorative chart series are addressed.
