# TR-004 — iOS Option B Live Data + Mockup Fidelity

**Agent:** Tester  
**Date:** 2026-07-10  
**Story:** US-IOS-OPTION-B  
**Design review:** DR-006 (FAIL)

## VERDICT: **FAIL**

Smoke tests pass; visual QA and mockup fidelity **FAIL**. Delivery blocked per `AGENTS.md` and `.cursor/rules/mockup-agent-qa.mdc`.

---

## 0. Smoke tests

| Test | Result |
|------|--------|
| `xcodebuild` Pulsefolio scheme | **PASS** |
| `TabScreenshotUITests` capture 01/02/03/04/06 | **PASS** |
| API `GET /api/v1/public/dashboard` | **PASS** (200, live values) |
| API `GET /api/v1/public/insights` | **PASS** |

## 1. Functional completeness

| Criterion | Result | Notes |
|-----------|--------|-------|
| Live portfolio value on Briefing | **PASS** | ~$147K from API |
| Live recommendation strip | **PASS** | BND qty from API |
| Approve / dismiss / rebalance actions | **PASS** | API wired |
| Insights sheet + live feed | **PASS** | 6 insights loaded |
| Activity trades from API | **PASS** | TradesView fetches |
| AC-B01–B10 native SwiftUI | **N/A** | Mockup-shell architecture |
| Mockup visual fidelity (P0) | **FAIL** | See DR-006 |

## 2. Visual mockup fidelity

**FAIL** — screenshots diverge from approved PNGs due to opaque overlay patches (DR-006).

## 3. Cross-platform parity

Web dashboard uses native charts; iOS uses mockup PNG + overlays. Parity is **intentionally deferred** for Option B shell; not a TR blocker if mockup fidelity passes.

## 4. Critical blockers

1. **BLK-V01** — Opaque `MockupSolidMask` destroys mockup regions (briefing, portfolio, decision).
2. **BLK-V02** — Briefing 2×2 metrics mapped to wrong tiles (risk/confidence swap).
3. **BLK-V03** — Portfolio status strip and holdings sparklines not visible as designed.
4. **BLK-P01** — Design Reviewer gate skipped on prior delivery (process failure).

## Required before PASS

1. Developer fixes per DR-006 (items 1–5).
2. Re-run **DR-007** → must PASS.
3. Re-run **TR-004b** → must PASS.
