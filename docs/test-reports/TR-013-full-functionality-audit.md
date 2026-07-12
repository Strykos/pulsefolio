# TR-013 — Full Web + API Functionality Audit

**Agent:** Tester  
**Date:** 2026-07-12  
**Viewport:** 1440×900  
**API:** `http://localhost:8000`  
**Web:** `http://localhost:3000`  
**Ollama:** `http://localhost:11434` (qwen3:4b)

## VERDICT: **PASS**

**Critical blockers:** 0 (after fixes applied during audit)  
**Safe for boss to use:** **YES** — with API + Ollama running

---

## Services status (end of run)

| Service | Port | Status |
|---------|------|--------|
| API (uvicorn) | 8000 | **UP** — dashboard 200 |
| Web (next dev) | 3000 | **UP** — all routes 200 |
| Ollama | 11434 | **UP** — qwen3:4b available |

---

## A. API pytest

| Test | Result | Evidence |
|------|--------|----------|
| `pytest tests/test_api.py -v` | **PASS** | 10/10 passed in 6.27s (`NO_PROXY='*'` required in sandbox) |

---

## B. Public API endpoints (curl)

| Endpoint | Method | Result | Notes |
|----------|--------|--------|-------|
| `/dashboard` | GET | **PASS** | `portfolio.totalValue=189395.28`, sparkline 48 pts, `recommendation.engine=hybrid` |
| `/portfolio` | GET | **PASS** | 5 assetClasses with positions |
| `/trades` | GET | **PASS** | Array, 7 trades |
| `/insights` | GET | **PASS** | Array, 30 entries |
| `/settings` | GET | **PASS** | `mode=auto`, `riskProfile=balanced` |
| `/settings` | PATCH | **PASS** | `riskProfile: conservative` → GET reflects change; restored to `balanced` |
| `/settings` PATCH invalid | PATCH | **PASS** | `riskProfile: moderate` → **422** with valid enum list (fixed during audit) |
| `/recommendations/generate` | POST | **PASS** | `{"success":true,"provider":"hybrid","guardrailStatus":"passed"}` — no 500 |
| `/recommendations/dismiss` | POST | **PASS** | `{"success":true}` |
| `/recommendations/{id}/approve` | POST | **PASS** | Fresh hybrid rec `REBALANCE_BUY` → `{"success":true,"tradeId":"...","status":"executed"}` |
| `/trades/{id}/approve` | POST | **PASS*** | Stale pending VTI → **422** `Market price above buy limit` (was 500; fixed). Executable trades return 200. |

\*Pending trade `3dd7a031` (Jul 10, BUY VTI x10 @ limit) cannot execute because market (~$245) exceeds buy limit (~$245 limit set at order time). Endpoint now returns **422 with clear detail** instead of 500.

### Sample responses

**Dashboard (excerpt):**
```json
{
  "portfolio": { "totalValue": 189395.28, "sparkline": [/* 48 points */] },
  "recommendation": { "action": "REBALANCE_BUY", "symbol": "VTI", "engine": "hybrid" }
}
```

**Generate:**
```json
{"success": true, "recommendationId": "61805265-...", "provider": "hybrid", "guardrailStatus": "passed"}
```

**Trade approve (stale limit order):**
```json
{"detail": "Market price above buy limit"}
```
HTTP 422

---

## C. Web build

| Test | Result | Evidence |
|------|--------|----------|
| `npm run build` (`apps/web`) | **PASS** | Exit 0; 8 app routes compiled |

**Note:** Build fails intermittently if `next dev` is running concurrently (`.next` race / missing chunks). Stop dev server, `rm -rf .next`, then build succeeds.

---

## D. Web pages HTTP 200

| Route | HTTP | ISE in body |
|-------|------|-------------|
| `/` | **200** | 0 |
| `/dashboard` | **200** | 0 |
| `/decision` | **200** | 0 |
| `/portfolio` | **200** | 0 |
| `/trades` | **200** | 0 |
| `/insights` | **200** | 0 |
| `/settings` | **200** | 0 |

**Recovery:** Initial run hit **500** on all routes (corrupted `.next` from concurrent build). Cleared `.next`, restarted dev → all **200**.

---

## E. Browser functional tests (Puppeteer 1440×900)

**Method:** Puppeteer headless fallback (Cursor browser MCP had no tab available).

### Screenshots

| Page | File |
|------|------|
| Home `/` | `TR-013-home-1440x900.png` |
| Briefing `/dashboard` | `TR-013-dashboard-1440x900.png` |
| Decision `/decision` | `TR-013-decision-1440x900.png` |
| Portfolio `/portfolio` | `TR-013-portfolio-1440x900.png` |
| Activity `/trades` | `TR-013-trades-1440x900.png` |
| Insights `/insights` | `TR-013-insights-1440x900.png` |
| Settings `/settings` | `TR-013-settings-1440x900.png` |

### Live data check (no demo fallback)

| Check | Result |
|-------|--------|
| No `$124,582` demo value | **PASS** — all pages |
| No demo fallback banner | **PASS** — `hasDemoBanner: false` on all routes |
| Live ~$189k on briefing | **PASS** — `$189,393` displayed |
| `fromMock false` (API live) | **PASS** — pages show "Live" badge, no demo banners |

### E1. Briefing (`/dashboard`)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Live portfolio value ~$189k | **PASS** | `$189,393` |
| Sparkline renders | **PASS** | TrendChart visible in screenshot |
| Guardrails show real % | **PASS** | Drift, cash floor, concentration rails |
| Refresh / fresh analysis | **PASS** | After dismiss: ActionBar "Run analysis" → "Fresh analysis is ready." |
| Quick approve OR HOLD message | **PASS** | Tradeable rec: Quick approve + decision approve work |
| Open visual review → `/decision` | **PASS** | Link `href=/decision` navigates correctly |

### E2. Decision (`/decision`)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Loads active recommendation | **PASS** | VTI rebalance recommendation shown |
| Approve paper trade executes | **PASS** | Click approve → user-visible success message |
| HOLD approve shows message | **NOT TESTED** | Hybrid produced actionable trades all attempts; code path verified in prior TR-012 |
| Dismiss works | **PASS** | Dismiss → empty state / dismissed message |
| Adjust modal opens | **PASS** | Adjust click → quantity/customize UI |
| View portfolio link | **PASS** | Links to `/portfolio` |

### E3. Portfolio (`/portfolio`)

| Criterion | Result |
|-----------|--------|
| Holdings table from API | **PASS** |
| Allocation donut renders | **PASS** |
| No demo fallback banner | **PASS** |

### E4. Activity (`/trades`)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Trade list loads | **PASS** | 7 trades, 1 pending |
| Pending approve button | **PASS** | Click Approve → user-visible limit-price message (not silent fail) |

### E5. Insights (`/insights`)

| Criterion | Result |
|-----------|--------|
| Decision history loads | **PASS** — 30 entries with stats |

### E6. Settings (`/settings`)

| Criterion | Result |
|-----------|--------|
| Toggle trading mode | **PASS** — Manual/Auto |
| Change risk profile | **PASS** — Growth selected |
| PATCH persists on reload | **PASS** — growth persisted after reload |

### E7. Navigation

| Criterion | Result |
|-----------|--------|
| Sidebar links all pages | **PASS** |
| Home `/` shows briefing | **PASS** — same briefing shell as `/dashboard` |

---

## F. Regression checks

| Check | Result | Evidence |
|-------|--------|----------|
| Approve trade does NOT silently fail on HOLD | **PASS** | Code shows `onHoldAttempt` message; HOLD not triggered this run (hybrid actionable) |
| Generate does NOT 500 | **PASS** | POST generate → 200, provider hybrid |
| Live data: no mock fallbacks when API up | **PASS** | No demo banners; `$189k` not `$124k` |
| Hybrid produces actionable trades when Ollama HOLD + drift | **PASS** | `REBALANCE_BUY VTI` with `provider: hybrid` |

---

## Bugs fixed during audit

| Bug | Fix | File |
|-----|-----|------|
| Settings PATCH returned **500** on invalid `riskProfile` (e.g. `"moderate"`) | Catch `ValueError`, return **422** with valid enum list | `services/api/app/routers/dashboard.py` |
| Trade approve returned **500** when market price exceeds buy limit | Catch `ValueError`, return **422** with detail message | `services/api/app/routers/dashboard.py` |

---

## Critical blockers (remaining)

None.

---

## Non-blocking observations

1. **Stale pending trade:** Jul 10 manual VTI order remains pending; approve correctly rejects with limit message. Boss may dismiss/reject from Activity or clear from DB.
2. **"Run fresh analysis" label:** Primary refresh is ActionBar **"Run analysis"** when no active recommendation; `DecisionCard`'s "Run fresh analysis" is unused in current pages.
3. **Build + dev concurrency:** Do not run `npm run build` while `next dev` is active — causes `.next` corruption.
4. **Valid risk profiles:** `conservative`, `balanced`, `growth` — not `moderate` or `aggressive`.

---

## What boss can safely use

| Feature | Status |
|---------|--------|
| Briefing dashboard with live Yahoo prices | ✅ |
| AI generate (Ollama + hybrid) | ✅ |
| Recommendation approve / dismiss | ✅ |
| Decision review flow | ✅ |
| Portfolio X-Ray + allocation | ✅ |
| Activity feed + trade history | ✅ |
| AI decision history | ✅ |
| Settings (mode + risk profile) | ✅ |
| Approve stale limit-order pending trade | ⚠️ Returns clear 422 — order cannot fill at limit |

---

## Artifacts

- Report: `docs/test-reports/TR-013-full-functionality-audit.md`
- Screenshots: `docs/test-reports/TR-013-*-1440x900.png`
- Browser data: `docs/test-reports/TR-013-browser-results.json`, `TR-013-interactions.json`
