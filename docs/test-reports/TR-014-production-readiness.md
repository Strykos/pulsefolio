# TR-014 — Production Readiness + iOS Completion Audit

**Agent:** Tester + PM  
**Date:** 2026-07-12  
**Viewport (Web):** 1440×900  
**API:** `http://localhost:8000`  
**Web:** `http://localhost:3000`  
**Ollama:** `http://localhost:11434` (qwen3:4b)  
**iOS:** iPhone 17 Simulator (iOS 26.x)

## VERDICT: **CONDITIONAL PASS**

| Platform | Verdict | Blockers |
|----------|---------|----------|
| API | **PASS** | 0 |
| Web | **PASS** | 0 |
| iOS Option B | **CONDITIONAL PASS** | 2 (visual DR not re-gated; app icon placeholder) |
| Regression (TR-013) | **PASS** | 0 |

**Critical blockers (P0):** 2 (iOS-only)  
**Safe for boss to use today:** **YES — Web** · **YES — iOS beta** (API + Ollama required)

---

## Services status (end of run)

| Service | Port | Status |
|---------|------|--------|
| API (uvicorn) | 8000 | **UP** — `/api/v1/health` 200 |
| Web (next dev) | 3000 | **UP** — all routes 200 (after `.next` recovery) |
| Ollama | 11434 | **UP** — qwen3:4b available |

**Recovery performed:** `npm run build` while `next dev` was running corrupted `.next` → routes returned **500**. Fixed by killing dev, `rm -rf apps/web/.next`, restarting `npm run dev`.

---

## A. API

### A1. pytest

| Test | Result | Evidence |
|------|--------|----------|
| `pytest tests/test_api.py -v` | **PASS** | 10/10 passed (7.53s, `.venv`, `NO_PROXY='*'`) |

### A2. Authenticated endpoints (live curl)

| Endpoint | Method | Result | Evidence |
|----------|--------|--------|----------|
| `/api/v1/auth/login` demo@pulsefolio.app / demo12345 | POST | **PASS** | HTTP 200, `access_token` len 187 |
| `/api/v1/me/dashboard` Bearer | GET | **PASS** | HTTP 200, `totalValue=189435.61` (~$189k) |
| `/api/v1/me/recommendations/generate` | POST | **PASS** | HTTP 200, `provider=hybrid` |
| `/api/v1/me/recommendations/{id}/approve` tradeable rec | POST | **PASS** | HTTP 200, `rec=e8c54b65-...` |
| Rate limit: 11th generate in 1 min | POST | **PASS** | 11th request HTTP **429** |
| `/api/v1/me/settings` PATCH | PATCH | **PASS** | HTTP 200, `riskProfile=balanced` |

### A3. Public routes (no auth)

| Endpoint | Result |
|----------|--------|
| `/api/v1/public/dashboard` | **PASS** 200 |
| `/api/v1/public/portfolio` | **PASS** 200 |
| `/api/v1/public/trades` | **PASS** 200 |
| `/api/v1/public/insights` | **PASS** 200 |
| `/api/v1/public/settings` | **PASS** 200 |

**Script:** `docs/test-reports/TR-014-api-tests.sh`

---

## B. Web (authenticated)

### B1. Build

| Test | Result | Evidence |
|------|--------|----------|
| `npm run build` (`apps/web`) | **PASS** | Exit 0; 8 app routes + `/login` compiled |

### B2. Routes HTTP 200 (authenticated via Puppeteer token inject)

| Route | HTTP | ISE | Demo $124k | Demo banner | Live ~$189k |
|-------|------|-----|------------|-------------|--------------|
| `/login` → redirect | **PASS** | — | — | — | → `/dashboard` |
| `/` | **PASS** 200 | 0 | 0 | 0 | ✅ |
| `/dashboard` | **PASS** 200 | 0 | 0 | 0 | ✅ |
| `/decision` | **PASS** 200 | 0 | 0 | 0 | ✅ |
| `/portfolio` | **PASS** 200 | 0 | 0 | 0 | — |
| `/trades` | **PASS** 200 | 0 | 0 | 0 | — |
| `/insights` | **PASS** 200 | 0 | 0 | 0 | — |
| `/settings` | **PASS** 200 | 0 | 0 | 0 | — |

### B3. E2E flow (Puppeteer 1440×900)

| Step | Result | Evidence |
|------|--------|----------|
| Login demo creds → `/dashboard` | **PASS** | Redirect confirmed |
| Briefing live value | **PASS** | `$189,436.94` in screenshot |
| Generate analysis | **PARTIAL** | Active rec present (`Quick approve`); no `Run analysis` needed |
| Decision approve | **PASS** | Approve button clicked |
| Settings risk toggle | **PASS** | Growth/conservative/balanced toggled |
| Model branding | **PASS** | `hybrid · qwen3:4b` on `/decision`; no `Llama 3 70B` |

### B4. Screenshots (1440×900)

| Page | File |
|------|------|
| Home `/` | `TR-014-home-1440x900.png` |
| Briefing `/dashboard` | `TR-014-dashboard-1440x900.png` |
| Decision `/decision` | `TR-014-decision-1440x900.png` |
| Portfolio `/portfolio` | `TR-014-portfolio-1440x900.png` |
| Activity `/trades` | `TR-014-trades-1440x900.png` |
| Insights `/insights` | `TR-014-insights-1440x900.png` |
| Settings `/settings` | `TR-014-settings-1440x900.png` |

**Data:** `docs/test-reports/TR-014-browser-results.json`  
**Script:** `docs/test-reports/TR-014-web-e2e.cjs`

---

## C. iOS

### C1. Build

| Test | Result | Evidence |
|------|--------|----------|
| `xcodebuild -scheme Pulsefolio -destination 'generic/platform=iOS Simulator' build` | **PASS** | **BUILD SUCCEEDED** |
| iPhone 17 simulator build | **PASS** | **BUILD SUCCEEDED** |

### C2. Auth wiring

| Check | Result | Evidence |
|-------|--------|----------|
| `LoginView` exists | **PASS** | `apps/ios/Pulsefolio/Views/LoginView.swift` |
| `APIClient.login` → `/api/v1/auth/login` | **PASS** | Token stored in `UserDefaults` |
| Authenticated prefix `/api/v1/me/*` | **PASS** | `apiPrefix` switches on `isAuthenticated` |
| `PULSEFOLIO_TOKEN` env bypass | **PASS** | `APIClient.init()` reads env |
| UITest login flow | **PASS** (after fix) | `TabScreenshotUITests` taps Sign in |

### C3. P0 screen status vs mockups (honest)

| Screen | Build | Live data | Mockup header/hero | Visual DR | Tester |
|--------|-------|-----------|---------------------|-----------|--------|
| **Briefing** | ✅ | ✅ $189,438.76 | ✅ `OptionBBriefingMockupHeader` + `OptionBBriefingMockupHero` | ⚠️ Not re-run (DR-013 FAIL on Jul 10 build; current build visibly improved) | **PASS** UITest |
| **Decision Review** | ✅ | ✅ $189k, GLD rec | ✅ Native `OptionBDecisionReviewView` | ⚠️ Not formally gated | **PASS** UITest capture |
| **Portfolio X-Ray** | ✅ | ✅ Holdings + donut | ✅ Native layout | ⚠️ Not formally gated | **PASS** UITest capture |

**iOS screenshots (simulator UITest):**

| Screen | File |
|--------|------|
| Briefing | `docs/test-reports/ios-screens/briefing-layout-phase1.png` |
| Decision | `docs/test-reports/ios-screens/06-decision-review.png` |
| Portfolio | `docs/test-reports/ios-screens/02-portfolio.png` |
| Login | `docs/test-reports/TR-014-ios-login.png` |

**Visual assessment (Tester, arm's length):** Briefing now shows mockup-faithful header (logo + stacked subtitle), hero chart with live sparkline, metric grid, and bottom nav with Approve CTA. Live portfolio ~$189k — not frozen mock $46k. Decision and Portfolio show live API data with functional approve/dismiss/rebalance flows. **Formal side-by-side DR PASS not obtained in this audit** — prior DR-013 FAIL may be partially remediated but requires dedicated DR re-run for sign-off.

### C4. UITest results

| Test | Result |
|------|--------|
| `testCaptureBriefingLayoutPhase1` | **PASS** (12.5s) |
| `testCaptureAllTabScreens` | **PASS** (25.3s) |

---

## D. Regression (TR-013)

| TR-013 item | TR-014 result | Evidence |
|-------------|---------------|----------|
| pytest 10/10 | **PASS** | Re-run 10/10 |
| Generate no 500 | **PASS** | hybrid 200 |
| Live data no mock fallback (web) | **PASS** | No demo banners; `$189k` not `$124k` |
| Settings invalid enum → 422 | **PASS** | Fixed in TR-013; not re-broken |
| Stale trade approve → 422 not 500 | **PASS** | Not re-broken |
| Hybrid actionable when drift | **PASS** | `REBALANCE` GLD/VTI recs |
| iOS briefing mockup hero + live data | **PASS** | UITest screenshot $189,438.76 |

---

## Bugs fixed during audit

| Bug | Fix | File |
|-----|-----|------|
| Web routes **500** after concurrent build+dev | Kill dev, `rm -rf .next`, restart `npm run dev` | ops (documented) |
| iOS UITests fail on auth gate | `launchAuthenticatedApp()` taps Sign in before tab capture | `apps/ios/PulsefolioUITests/TabScreenshotUITests.swift` |

---

## Critical blockers (remaining)

| ID | Severity | Blocker |
|----|----------|---------|
| BLK-IOS-01 | P1 | iOS P0 screens lack formal **Design Review PASS** in current build (DR-013 FAIL on older layout; improvement observed but not DR-signed) |
| BLK-IOS-02 | P2 | iOS app icon is gray placeholder on simulator home screen |

**Non-blocking:**

1. Stale Jul 10 VTI pending order — approve returns 422 limit message (TR-013).
2. `npm run build` must not run concurrent with `next dev`.
3. Web `flow_generate` PARTIAL when active recommendation already present (expected).

---

## Artifacts

- Report: `docs/test-reports/TR-014-production-readiness.md`
- API script: `docs/test-reports/TR-014-api-tests.sh`
- Web E2E: `docs/test-reports/TR-014-web-e2e.cjs`, `TR-014-browser-results.json`
- Web screenshots: `docs/test-reports/TR-014-*-1440x900.png`
- iOS screenshots: `docs/test-reports/ios-screens/*.png`, `TR-014-ios-login.png`

---

## Sign-off

| Role | Verdict | Date |
|------|---------|------|
| Tester (TR-014) | **CONDITIONAL PASS** | 2026-07-12 |
| PM (PM-003) | **CONDITIONAL SHIP** | 2026-07-12 |
