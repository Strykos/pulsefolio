# TR-003 — iOS Immersive Hero vs approved mockups

**Date:** 2026-07-10  
**Story:** US-IOS-IMMERSIVE (Option B implementation)  
**Approved mockups:**
- `pulsefolio-ios-option-b-briefing.png`
- `pulsefolio-ios-option-b-decision.png`
- `pulsefolio-ios-option-b-portfolio.png`  
**Implementation evidence:** `docs/test-reports/ios-screens/*.png`  
**Tester verdict:** **FAIL**

## Process failure (before visual criteria)

| Step | Required | What happened |
|------|----------|---------------|
| Mockup approval | User approved Option B | ✅ |
| PM agent | AC + FAIL blockers from mockups | ❌ **Skipped** |
| Developer | Build to AC only | ❌ Built ad-hoc without AC |
| Tester agent | Screenshot vs **mockup** (not just web parity) | ❌ **Never run** |
| User delivery | Only after Tester PASS | ❌ User shown implementation directly |

**TR-002b is not a substitute.** It only checked iOS vs **web** chart regions. It did **not** compare iOS to **approved iOS mockups**.

## Smoke tests

| Check | Result |
|-------|--------|
| `xcodebuild` | PASS |
| Simulator launch | PASS |
| UI scroll test | PASS |

Smoke PASS does **not** override visual FAIL per `agents/tester.md`.

## Visual fidelity — Morning Briefing (P0 blockers)

| # | Mockup (Option B) | Implementation | Verdict |
|---|-------------------|----------------|---------|
| 1 | Pulsefolio logo + sparkle header row | System nav title "Morning Briefing" only | **FAIL** |
| 2 | Hero: chart dominates with floating glass "+1.24% Today" card on chart | Chart + separate duplicate status row below | **FAIL** |
| 3 | Timeframe pills: 1D 7D **30D** 3M YTD 1Y ALL on hero | 1D 1W 1M 3M only, different styling/placement | **FAIL** |
| 4 | Allocation tile: centered donut, "5 Assets" | Tiny side donut + "6 assets" text | **FAIL** |
| 5 | Risk tile: semi-circular gauge, needle, gradient arc | Plain number "7.4" + label | **FAIL** |
| 6 | Confidence tile: large ring, "78% High" | Small ring, cramped in tile | **FAIL** |
| 7 | Drift tile: orange sparkline + "Allocation drift detected" | Warning icon + text only, no chart | **FAIL** |
| 8 | "Swipe up for evidence" affordance | Evidence accordion lower on page, no sheet affordance | **FAIL** |
| 9 | Large **Approve Trade** FAB (bottom-right) | Full-width sticky bar, different hierarchy | **FAIL** |
| 10 | Option B nav: Briefing / Review / Activity (3 tabs) | 5-tab bar (Briefing/Portfolio/Activity/Insights/Settings) | **FAIL** (scope drift) |

## Visual fidelity — Decision Review sheet

| # | Mockup | Implementation | Verdict |
|---|--------|----------------|---------|
| 1 | Cinematic before→after hero (large donuts, energy flow) | Smaller donuts in card, less dramatic | **FAIL** |
| 2 | Metric orbs on hero (Confidence / Return / Guardrails 3/3) | Gauges below fold, different layout | **FAIL** |
| 3 | Bottom sheet pulled up with position table + evidence | Scroll stack, no sheet composition | **FAIL** |

## Visual fidelity — Portfolio

| # | Mockup | Implementation | Verdict |
|---|--------|----------------|---------|
| 1 | Treemap hero dominates top 50% | Concentration grid cards (closer) but no full-bleed treemap hero | **PARTIAL / FAIL** |
| 2 | Pull-up sheet for holdings | List below, no sheet | **FAIL** |

## Root cause

Developer agent implemented from memory of mockup conversation, not pixel/regional fidelity to approved PNGs. Tester agent was not invoked. User became manual QA — same failure as earlier Observatory work.

## Required before user delivery

1. PM story with per-screen AC mapped to `pulsefolio-ios-option-b-*.png`
2. Rebuild or polish to close all P0 blockers above
3. Tester re-run: side-by-side mockup vs `ios-screens/` — **PASS required**
4. Parent agent must not claim "done" until TR-003b PASS
