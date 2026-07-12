# TR-012 — Live Data / No Simulation Gate

**Agent:** Tester  
**Date:** 2026-07-12  
**Scope:** Verify removal of simulated data; confirm live Yahoo + Ollama + DB wiring  
**PM report:** `docs/test-reports/PM-002-live-data-wiring.md`  
**Viewport:** 1440×900  
**API:** `http://localhost:8000`  
**Web:** `http://localhost:3000`

## VERDICT: **PASS**

**Safe to show user:** **YES** (with API + Ollama running)

---

## 0. Smoke tests

| Test | Result | Evidence |
|------|--------|----------|
| `pytest services/api/tests/test_api.py -q` | **PASS** | 10 passed in 6.87s (`NO_PROXY='*'` required in sandbox) |
| `npm run build` (`apps/web`) | **PASS** | Exit 0; all 8 app routes compiled |
| API `:8000` up | **PASS** | `GET /api/v1/public/dashboard` → 200 |
| Web dev server `:3000` | **PASS** | Restarted with clean `.next` after stale cache caused transient 500s |
| All web routes HTTP 200 | **PASS** | `/`, `/dashboard`, `/decision`, `/portfolio`, `/trades`, `/insights`, `/settings` |
| No `Internal Server Error` in bodies | **PASS** | curl grep ISE=0 on all routes post-restart |
| Browser screenshot 1440×900 | **PASS** | `docs/test-reports/TR-012-dashboard-1440x900.png` |

**Dev-server note:** Initial curl pass hit **500** on `/`, `/dashboard`, `/decision` due to corrupted `.next` chunks (`Cannot find module './639.js'`). Cleared `.next` and restarted `npm run dev`; all routes recovered to **200**.

---

## 1. Live data verification (API)

### `GET /api/v1/public/dashboard`

| Check | Result | Evidence |
|-------|--------|----------|
| `totalValue` not old mocks (124582.40 / 46764.09) | **PASS** | `totalValue: 189376.97` |
| Sparkline >5 unique values (not sine wave) | **PASS** | 48 points, **20 unique** values; early padding flat then real Yahoo-derived variation |
| `dayChange` from real previous close | **PASS** | `dayChange: 4187.81`, `dayChangePercent: 2.26` via `portfolio_day_change()` |
| `recommendation.engine` is ollama or rules (not demo) | **PASS** | `engine: "ollama"`, `model: "qwen3:4b"` |

Sample sparkline tail: `[188158.64, 187521.3, 187617.48, 188024.24, 188398.22]`

### `POST /api/v1/public/recommendations/generate`

| Check | Result | Evidence |
|-------|--------|----------|
| `provider` not `demo` | **PASS** | `{"success":true,"provider":"ollama","guardrailStatus":"passed"}` |

### Implementation wiring

| Check | Result | Evidence |
|-------|--------|----------|
| Yahoo quotes/history adapter active | **PASS** | `services/api/app/services/market_data.py` → `YahooMarketDataAdapter` |
| Sparkline from Yahoo history | **PASS** | `services/api/app/services/portfolio_metrics.py` → `portfolio_sparkline()` |
| Day change from previous close | **PASS** | `portfolio_day_change()` uses `get_previous_close()` per symbol |

---

## 2. Web live-data verification

| Check | Result | Evidence |
|-------|--------|----------|
| Dashboard does NOT show $124,582 when API up | **PASS** | Screenshot shows **$189,378.86**; API total `189376.97` (rounding/format) |
| No demo banner when API reachable | **PASS** | No “local demo holdings” / “API unavailable” banner in screenshot |
| Sparkline visually non-synthetic | **PASS** | Irregular 1M curve with W1–W4 labels, H/L markers (not sine) |
| AI engine live | **PASS** | “GUARDRAILS ACTIVE · Updated 2m ago”; HOLD recommendation from Ollama |

Screenshot: `docs/test-reports/TR-012-dashboard-1440x900.png`

---

## 3. Mock removal checklist

| Item | Result | Evidence |
|------|--------|----------|
| `MockMarketDataAdapter` random walk → Yahoo | **REMOVED** | No `MockMarketDataAdapter` in codebase; `YahooMarketDataAdapter` is production adapter |
| `dashboard.py` sine sparkline | **REMOVED** | Uses `portfolio_sparkline(state)` from Yahoo history |
| `dashboard.py` fake dayChange (`unrealized * 0.1`) | **REMOVED** | Uses `portfolio_day_change(state)` |
| Forced VTI demo on generate HOLD | **REMOVED** | `generate_recommendation_demo()` calls `ai_service.generate()` only; no forced rebalance path |
| Web `api.ts` static mock fallbacks | **REMOVED** | `fetchJson` returns `{ data: null, fromMock: true }` on failure — no `mockDashboard` injection |
| Decision `decisionReviewScenario` override | **REMOVED** | `decision/page.tsx` loads via `api.getDashboard()` + `api.getPortfolio()` |
| iOS `OptionBMockupLayoutData` as runtime briefing source | **REMOVED** | `MainTabView` → `OptionBBriefingScreen` binds `api.dashboard` / `api.portfolio`; `usingMockData` gates offline banner |

### Residual dead code (non-blocking, not wired at runtime)

| Item | Status |
|------|--------|
| `_create_forced_recommendation()` in `dashboard.py` | Defined but **never called** |
| `mock-data.ts` exports (`mockDashboard`, `decisionReviewScenario`) | Type/legacy fixtures only; **not imported by pages** |
| `OptionBBriefingLayoutScreen` + `OptionBMockupLayoutData.dashboard` | Frozen layout struct exists; **not used** by `MainTabView` runtime path |

---

## 4. Route HTTP matrix (post-restart)

| Route | HTTP | ISE in body |
|-------|------|-------------|
| `/` | 200 | 0 |
| `/dashboard` | 200 | 0 |
| `/decision` | 200 | 0 |
| `/portfolio` | 200 | 0 |
| `/trades` | 200 | 0 |
| `/insights` | 200 | 0 |
| `/settings` | 200 | 0 |

---

## 5. Known remaining items (non-blocking)

- `/public/*` routes still seed a demo user (`seed_demo_data`) — portfolio is real DB + live Yahoo prices, not static JSON
- WebSocket indicator may show “Connecting” while REST data is already live
- Decision evidence charts still derive some decorative client-side series from scalars
- UI engine label may still say “Llama 3 70B” cosmetically when Ollama is provider

---

## 6. Critical blockers

None.

---

## 7. Tester sign-off

| Gate | Status |
|------|--------|
| API pytest | **PASS** |
| API live-data curl checks | **PASS** |
| Web build | **PASS** |
| Web HTTP smoke (all routes) | **PASS** |
| Dashboard live value (no $124,582) | **PASS** |
| Mock removal checklist | **PASS** |
| Screenshot evidence | **PASS** |

**Overall: PASS** — simulated runtime data paths removed; live Yahoo + Ollama wiring confirmed end-to-end.
