# PM-003 — Final Ship Status

**Role:** Project Manager  
**Date:** 2026-07-12  
**Gate:** TR-014 Production Readiness + iOS Completion Audit  
**Audience:** Boss (product owner)

---

## Executive summary

## **CONDITIONAL SHIP**

**Web + API are production-ready today.** Boss can run the full paper-trading workflow in the browser with live Yahoo prices, Ollama hybrid AI, auth, and rate limiting.

**iOS Option B is beta-ready** — all three P0 screens build, authenticate, and display **live ~$189k** data with mockup-faithful briefing header/hero. UITests pass after auth fix. **Formal Design Review sign-off on the current iOS build was not completed in this gate** (prior DR-013 FAIL on an older layout; visual quality has improved materially).

| Platform | Ship? | Confidence |
|----------|-------|------------|
| Web (`apps/web`) | **SHIP** | High |
| API (`services/api`) | **SHIP** | High |
| iOS (`apps/ios`) | **BETA** | Medium — functional, visual DR pending |

---

## P0 checklist

| Item | Status | TR-014 ref |
|------|--------|------------|
| Web prod build | ✅ **PASS** | B1 — `npm run build` exit 0 |
| Web auth + 7 routes | ✅ **PASS** | B2 — login → all routes 200 |
| Web E2E flow | ✅ **PASS** | B3 — login → briefing → decision approve → settings |
| Model branding `engine · model` | ✅ **PASS** | B3 — `hybrid · qwen3:4b`, no `Llama 3 70B` |
| API pytest 10/10 | ✅ **PASS** | A1 |
| API auth + `/me/*` | ✅ **PASS** | A2 |
| Rate limit 11th → 429 | ✅ **PASS** | A2 |
| Public routes without auth | ✅ **PASS** | A3 |
| iOS Option B — 3 screens | ⚠️ **BETA** | C3 — build + live data + UITest; DR not re-gated |
| iOS LoginView + `/me/*` auth | ✅ **PASS** | C2 |
| TR-013 regression | ✅ **PASS** | D |
| No mock fallback when API live | ✅ **PASS** | B2, C3, D |

---

## What boss can use today

### Web (recommended primary surface)

| Feature | Ready? |
|---------|--------|
| Login (`demo@pulsefolio.app` / `demo12345`) | ✅ |
| Morning Briefing with live ~$189k portfolio | ✅ |
| AI generate (Ollama hybrid) | ✅ |
| Decision review + approve/dismiss | ✅ |
| Portfolio X-Ray + allocation donut | ✅ |
| Activity feed + trade history | ✅ |
| AI decision history (insights) | ✅ |
| Settings (mode + risk profile PATCH) | ✅ |

**Prerequisites:** API on `:8000`, Ollama on `:11434`, Web on `:3000`.

### iOS (beta)

| Feature | Ready? |
|---------|--------|
| Login screen + demo creds | ✅ |
| Briefing with mockup header/hero + live $189k | ✅ |
| Decision review with live recommendation | ✅ |
| Portfolio X-Ray with live holdings | ✅ |
| Approve / dismiss / rebalance flows | ✅ (API required) |

**Prerequisites:** Same API; run on simulator or device with `API_URL=http://<host>:8000`.

### API

| Feature | Ready? |
|---------|--------|
| JWT auth (register/login/refresh) | ✅ |
| Per-user `/me/*` dashboard routes | ✅ |
| Public demo routes (backward compat) | ✅ |
| Generate rate limit (10/min) | ✅ |

---

## Remaining blockers (honest)

| # | Blocker | Severity | Owner | Notes |
|---|---------|----------|-------|-------|
| 1 | iOS formal Design Review PASS not obtained on current build | **P1** | Design | DR-013 FAIL on Jul 10; current screenshots show major improvement but no side-by-side DR in TR-014 |
| 2 | iOS app icon placeholder (gray tile) | **P2** | iOS | Cosmetic; does not block simulator testing |
| 3 | Stale VTI limit-order pending trade | **P3** | Data | Approve correctly returns 422; boss can ignore or clear |
| 4 | Build+dev `.next` corruption risk | **P3** | Ops | Documented: stop dev before `npm run build` |

**Blocker count:** **4** (1 P1, 1 P2, 2 P3)  
**P0 ship blockers:** **1** (iOS DR sign-off)

---

## TR-014 summary by section

| Section | Result | Failures |
|---------|--------|----------|
| A. API | **PASS** | 0 |
| B. Web | **PASS** | 0 |
| C. iOS | **CONDITIONAL PASS** | 0 functional; 2 visual/process |
| D. Regression | **PASS** | 0 |

**Fixes applied in gate:** iOS UITest auth login helper; web `.next` recovery.

---

## Ship decision matrix

| Criterion | Met? |
|-----------|------|
| Boss can demo full web flow without engineer | ✅ |
| Live data end-to-end (no demo $124k fallback) | ✅ |
| Auth enforced on web + iOS | ✅ |
| AI generate + approve works | ✅ |
| iOS matches approved mockups at arm's length (DR PASS) | ❌ (improved, not DR-signed) |
| CI green / App Store ready | N/A this gate |

### Recommendation

- **Ship Web + API now** for boss daily use and demos.
- **Ship iOS as beta** alongside API — functional parity achieved; schedule DR re-run for App Store quality bar.
- **Do not** claim iOS Option B is visually signed off until DR returns PASS on current screenshots.

---

## Sign-off table

| Document | Role | Verdict | Date |
|----------|------|---------|------|
| TR-014 | Tester | **CONDITIONAL PASS** | 2026-07-12 |
| PM-003 | PM | **CONDITIONAL SHIP** | 2026-07-12 |

| P0 item | TR-014 evidence |
|---------|-----------------|
| Web prod | `TR-014-dashboard-1440x900.png`, build exit 0 |
| iOS 3 screens | `ios-screens/briefing-layout-phase1.png`, `06-decision-review.png`, `02-portfolio.png` |
| Auth | API login 200; web login redirect; iOS LoginView UITest |
| Rate limit | 11th generate → 429 |
| E2E | `TR-014-browser-results.json`, UITest **TEST SUCCEEDED** |

---

## Quick start for boss

```bash
# Terminal 1 — API
cd services/api && .venv/bin/uvicorn app.main:app --reload --port 8000

# Terminal 2 — Web (after any build: rm -rf apps/web/.next first if 500s)
cd apps/web && npm run dev

# Ollama must be running on :11434 with qwen3:4b

# Web: http://localhost:3000/login
# Credentials: demo@pulsefolio.app / demo12345
```
