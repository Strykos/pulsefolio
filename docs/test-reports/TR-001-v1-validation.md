# TR-001 — Pulsefolio v1 Validation Test Report

**Agent:** Tester (Agent 4)  
**Date:** 2026-07-10  
**Build under test:** pulsefolio monorepo (local)  
**Tester gate:** Required before PM sign-off (PM-GATE-001)

---

## Executive summary

| Verdict | **CONDITIONAL PASS** |
|---------|----------------------|
| API | **PASS** — 8/8 automated tests |
| Web (5 pages) | **PASS** — all render HTTP 200 on port 3001 |
| Web production build | **PASS** — `next build` succeeds |
| iOS | **FAIL** — Swift sources only; no Xcode project, no XCTest run |
| Cloud worker | **NOT TESTED** — code present, no integration test executed |
| Agent workflow gates | **FAIL** — PM gate was skipped during initial delivery (remediated in this report) |

**Critical blocker found and remediated:** Running `next build` while `next dev` was active corrupted `.next` and caused HTTP 500 on port 3000. Cleared cache; dev verified on port 3001.

---

## 1. Functional completeness (per user story)

| Story | Criterion | Result | Evidence |
|-------|-----------|--------|----------|
| US-001 | Email/password register + login | **PASS** | `test_register_and_login` |
| US-001 | Sign in with Apple (iOS) | **DEFERRED** | Phase 2 — not implemented |
| US-001 | Web login UI | **FAIL** | No login screen on web; uses public demo API |
| US-002 | Multi-asset portfolio CRUD | **PASS** | `test_portfolio_crud_and_trade_flow` |
| US-002 | Portfolio editor UI | **PARTIAL** | Settings shows "Portfolio Editor →" button; no editor screen |
| US-003 | Dashboard value + allocation | **PASS** | Browser snapshot `/dashboard` — value, donut, sparkline |
| US-003 | Pulse line + live indicator | **PASS** | Components render; WebSocket connects when API up |
| US-003 | Animated value (odometer) | **PASS** | `AnimatedValue` component on dashboard |
| US-004 | AI recommendations structured | **PASS** | `test_ai_recommendation` — risk_impact, rationale |
| US-004 | AI card on dashboard | **PASS** | Approve/Dismiss buttons visible |
| US-005 | Manual approve trade | **PASS** | `test_portfolio_crud_and_trade_flow` approve flow |
| US-005 | Dismiss recommendation | **PASS** | `/api/v1/public/recommendations/dismiss` |
| US-006 | Auto-mode cloud worker 24/7 | **NOT TESTED** | `services/worker/main.py` exists; no run log |
| US-006 | Auto-mode toggle UI | **PASS** | Settings manual/auto toggle renders |
| US-007 | Risk score visible | **PASS** | Dashboard + portfolio show risk gauge |
| US-007 | Server-side guardrails | **PASS** | `test_ai_recommendation`, risk engine in API |
| US-008 | 4 themes | **PASS** | Settings shows Midnight, Aurora, Paper, Terminal |
| US-008 | Theme applies instantly | **PASS** | ThemeProvider + localStorage (manual click not auto-tested) |
| US-008 | Theme syncs via API | **PARTIAL** | Demo public settings only; no authenticated user prefs |
| US-009 | Trade history | **PASS** | `/trades` — Pending + History sections |
| US-009 | AI decision log | **PASS** | `/insights` — 3 decision entries; `test_decision_log` |
| US-010 | PAPER TRADING badge | **PASS** | `PaperTradingBadge` in AppShell + Sidebar |

---

## 2. Web page render matrix (browser validation)

Tested: 2026-07-10, `http://localhost:3001`, API at `:8000`

| Page | HTTP | Title | Key elements | Console errors |
|------|------|-------|--------------|----------------|
| `/dashboard` | 200 | Pulsefolio | Value, Allocation, Trend, Risk, AI card, Approve/Dismiss | None observed |
| `/portfolio` | 200 | Pulsefolio | Risk gauge, Rebalance CTA, asset groups | None observed |
| `/trades` | 200 | Pulsefolio | Pending Approvals, History, filter, Approve | None observed |
| `/insights` | 200 | Pulsefolio | Decision log with rationale quotes | None observed |
| `/settings` | 200 | Pulsefolio | Mode toggle, 4 themes, risk/motion/sound | None observed |

---

## 3. API automated tests

```
pytest tests -v
8 passed, 1 warning (Starlette httpx deprecation)
```

| Test | Result |
|------|--------|
| test_health | PASS |
| test_register_and_login | PASS |
| test_portfolio_crud_and_trade_flow | PASS |
| test_ai_recommendation | PASS |
| test_settings_auto_mode | PASS |
| test_market_prices | PASS |
| test_decision_log | PASS |
| test_dashboard_endpoints | PASS |

---

## 4. Cross-platform parity (iOS vs web)

| Feature | Web | iOS | Parity |
|---------|-----|-----|--------|
| 5-tab navigation | PASS | Source only | **FAIL** — iOS not built/run |
| Dashboard | PASS | Source only | **FAIL** |
| 4 themes | PASS | Source only | **FAIL** |
| API integration | PASS (public) | Partial path | **PARTIAL** |

**iOS blocker:** No `.xcodeproj` — cannot run Simulator or XCTest without manual Xcode project creation.

---

## 5. Security

| Check | Result | Notes |
|-------|--------|-------|
| JWT auth on protected routes | **PASS** | portfolios, trades require Bearer token |
| Public demo routes isolated | **PASS** | `/api/v1/public/*` separate from auth routes |
| Input validation (email) | **PASS** | Rejects invalid TLDs |
| Guardrails server-side | **PASS** | Risk engine rejects bad trades |
| Secrets in client bundles | **PASS** | No API keys in web/ios source |
| Rate limiting on AI | **FAIL** | Not implemented |

---

## 6. Performance

| Metric | Result | Target |
|--------|--------|--------|
| API `/public/dashboard` latency | **84ms** | < 500ms — PASS |
| Web First Load JS (dashboard) | **163 kB** | Acceptable |
| `next build` time | **3.4s compile** | PASS |

---

## 7. Critical blockers

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| BLK-001 | **HIGH** | `next build` + `next dev` concurrently corrupts `.next` → HTTP 500 | **FIXED** — clear `.next`, restart dev; documented in smoke-test.sh |
| BLK-002 | **HIGH** | PM testing gate skipped on initial delivery | **REMEDIATED** — this report + PM-GATE-001 |
| BLK-003 | **HIGH** | No iOS Xcode project — cannot validate native app | **OPEN** |
| BLK-004 | **MEDIUM** | No Playwright E2E automation in CI | **OPEN** — smoke-test.sh added |
| BLK-005 | **MEDIUM** | Cloud worker not integration tested | **OPEN** |
| BLK-006 | **LOW** | Web has no login UI (demo-only) | **OPEN** — US-001 partial |

---

## 8. Tester recommendation

**Do not mark v1 as complete.** Approve for **web + API demo** only. Block iOS and production deploy until BLK-003 and BLK-005 are resolved.

**Signed:** Agent 4 — Tester  
**Report path:** `docs/test-reports/TR-001-v1-validation.md`
