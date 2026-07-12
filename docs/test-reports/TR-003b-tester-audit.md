# TR-003b — iOS Immersive Hero formal visual audit

**Date:** 2026-07-10  
**Agent:** Tester (Agent 4)  
**Story:** US-IOS-IMMERSIVE (Option B)  
**VERDICT:** **FAIL**

## Process gap (confirmed)

| Step | Required | Actual |
|------|----------|--------|
| PM AC from mockups | Yes | **Skipped** |
| Build to AC | Yes | Built ad-hoc |
| Tester vs **iOS mockups** | Yes | **Never run before user saw build** |
| TR-002b web parity | Optional extra | Ran — **not a substitute** |

User was manual QA. Same failure mode as TR-002.

## Evidence

| Screen | Mockup | Implementation |
|--------|--------|----------------|
| Briefing | `pulsefolio-ios-option-b-briefing.png` | `ios-screens/01-briefing.png` |
| Decision | `pulsefolio-ios-option-b-decision.png` | `ios-screens/06-decision-review.png` |
| Portfolio | `pulsefolio-ios-option-b-portfolio.png` | `ios-screens/02-portfolio.png` |

## Top 10 blockers

1. **BLK-01** — No Pulsefolio logo/wordmark header on any screen
2. **BLK-02** — Risk tile: plain number, not semi-circular gauge with needle
3. **BLK-03** — Allocation tile: tiny side donut, not centered "N Assets" hero donut
4. **BLK-04** — Drift tile: no orange sparkline chart
5. **BLK-05** — Nav: 5-tab bar vs mockup 3-tab + Approve Trade CTA on Briefing
6. **BLK-06** — Decision: missing Position Impact table (5 columns)
7. **BLK-07** — Decision: missing Guardrails 3/3 orb + energy-flow between donuts
8. **BLK-08** — Portfolio: no masonry treemap hero with logos + glow
9. **BLK-09** — Portfolio: missing STOCK/ETF/CRYPTO/BOND status strip
10. **BLK-10** — Portfolio: missing Holdings Preview sheet with sparklines

## Per-screen summary

- **Briefing:** FAIL — header, floating glass card, timeframe pills, 2×2 tiles, swipe-up affordance, nav/CTA all diverge
- **Decision Review:** FAIL — sheet composition, position table, guardrails checklist, hero drama
- **Portfolio:** FAIL — treemap hero, status strip, holdings sheet

## Gate

| Check | Result |
|-------|--------|
| xcodebuild | PASS |
| Mockup fidelity | **FAIL** |
| **Overall** | **FAIL — do not deliver** |

Next: PM AC from mockups → rebuild → TR-003c re-test PASS required.
