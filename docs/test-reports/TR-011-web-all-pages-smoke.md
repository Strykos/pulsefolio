# TR-011 — Web All-Pages Smoke Test

**Agent:** Tester  
**Date:** 2026-07-11  
**Viewport:** 1440×900  
**Dev server:** `http://localhost:3000` (Next.js 15.5.20)

## VERDICT: **PASS**

---

## 1. Build smoke

| Check | Result |
|-------|--------|
| `npm run build` (`apps/web`) | **PASS** — exit code 0 |
| Next.js compile | **PASS** — all 8 app routes built |
| Typecheck / lint gate | **PASS** |

**Build output routes:** `/`, `/dashboard`, `/decision`, `/insights`, `/portfolio`, `/settings`, `/trades`

---

## 2. Dev server

| Check | Result |
|-------|--------|
| `http://localhost:3000` reachable | **PASS** — started via `npm run dev` |
| Ready signal | **PASS** — Ready in ~866ms |

---

## 3. HTTP smoke (curl)

| Route | HTTP | Internal Server Error | Bytes |
|-------|------|----------------------|-------|
| `/` | **200** | no | 12,785 |
| `/dashboard` | **200** | no | 13,943 |
| `/decision` | **200** | no | 13,934 |
| `/portfolio` | **200** | no | 13,943 |
| `/trades` | **200** | no | 13,915 |
| `/insights` | **200** | no | 13,933 |
| `/settings` | **200** | no | 13,934 |

**HTTP verdict:** **PASS** — all routes 200, no `Internal Server Error` in response body.

---

## 4. Browser render smoke (1440×900)

**Method:** Headless Chromium via Puppeteer (viewport 1440×900, `networkidle2` + 1.5s settle).  
**Note:** Cursor browser MCP could not attach tabs in this run (`browser_navigate` → "No browser tab available"); visual verification completed via Puppeteer fallback with equivalent checks.

| Route | Render | Reason |
|-------|--------|--------|
| `/` | **PASS** | Pulsefolio shell + Briefing content; 1,292 chars body text; no runtime/build error overlay |
| `/dashboard` | **PASS** | Briefing dashboard with charts, guardrails, allocation; demo fallback banner present |
| `/decision` | **PASS** | AI Decision Review with before/after portfolio, risk gauges, rebalance CTA |
| `/portfolio` | **PASS** | Portfolio X-Ray, holdings table, drift signals |
| `/trades` | **PASS** | Activity feed, pending approvals, trade history |
| `/insights` | **PASS** | AI decision history with confidence stats |
| `/settings` | **PASS** | Trading mode, appearance, preferences panels |

**Browser verdict:** **PASS** — all routes render substantive UI; no blank page, 404, or Next.js error overlay.

---

## 5. Observations (non-blocking)

- **Demo fallback active:** Pages show copy such as "Demo data is shown because the local API is unavailable" and "Offline PAPER" on `/decision`. Expected when API (`localhost:8000`) is not running; UI still renders correctly with curated demo data.
- **`/` and `/dashboard`:** Both resolve to Briefing content in this build (home shows same briefing shell as dashboard).

---

## Critical blockers

None.

---

## Safe to show user

**YES** — build succeeds, all routes return HTTP 200, and every page renders real Observatory UI at 1440×900 with demo data (no crashes or error overlays).

---

## Evidence

Screenshots (1440×900):

- `docs/test-reports/web-screens/TR-011-home-1440x900.png`
- `docs/test-reports/web-screens/TR-011-dashboard-1440x900.png`
- `docs/test-reports/web-screens/TR-011-decision-1440x900.png`
- `docs/test-reports/web-screens/TR-011-portfolio-1440x900.png`
- `docs/test-reports/web-screens/TR-011-trades-1440x900.png`
- `docs/test-reports/web-screens/TR-011-insights-1440x900.png`
- `docs/test-reports/web-screens/TR-011-settings-1440x900.png`
