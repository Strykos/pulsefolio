# TR-002 — iOS Observatory cross-platform parity

**Date:** 2026-07-10  
**Story:** Observatory visual treatment — iOS must match web dashboard fidelity  
**Mockup reference:** `pulsefolio-ai-decision-concept.png` + live web `/dashboard` at 1440×900  
**Tester verdict:** **FAIL** (initial audit — user should not have been manual QA)

## Smoke tests

| Check | Result |
|-------|--------|
| `xcodebuild` (Pulsefolio, iPhone 17 Simulator) | PASS |
| Simulator boot + app launch (`ios-run.sh`) | PASS |
| `npm run build` (web reference) | PASS |

## Cross-platform parity (iOS vs web Briefing)

| Criterion | Web | iOS (before fix) | Result |
|-----------|-----|------------------|--------|
| Evidence rail (drift / cash / concentration charts) | Visible | Missing | **FAIL** |
| Large interactive trend chart | `PremiumTrendChart` / `TrendChart` | 48px sparkline only | **FAIL** |
| Risk / return / confidence metric gauges | 3 circular gauges | Text impact stats only | **FAIL** |
| Guardrail pass/review panels | 3 checks with sliders | Label text only | **FAIL** |
| Allocation donut | Donut with legend | Horizontal bars | **FAIL** |
| Chart-first density | 3-column grid | Text-heavy scroll | **FAIL** |
| `ObservatoryHeroView` wired | N/A | **Built but unused** | **FAIL** |
| `DonutHeroView` wired | N/A | **Built but unused** | **FAIL** |
| `PremiumTrendChartView` wired | N/A | **Built but unused** | **FAIL** |

## Root cause

1. iOS “Observatory” pass only added `ObservatoryPanel` wrappers — same mistake as early web pass.
2. Rich SwiftUI chart components exist in `PremiumComponents.swift` but were **never connected** to `MainTabView`.
3. Tester previously PASS’d on **file inspection / xcodebuild only** — no simulator screenshot vs web comparison.
4. Cross-platform parity was not an explicit FAIL blocker in tester checklist.

## Critical blockers (max 5)

1. Briefing screen lacks evidence charts visible on web.
2. Briefing lacks metric gauge row (risk / return / confidence).
3. Briefing lacks allocation donut — uses text bars instead.
4. Premium chart components unused despite being implemented.
5. No simulator visual QA against web reference before delivery.

## Remediation

- Wire `ObservatoryHeroView`, `DonutHeroView`, evidence/guardrail/gauge views into all iOS tabs.
- Re-run Tester with **simulator screenshots** + web side-by-side checklist.
- Update `agents/tester.md` — cross-platform parity is mandatory FAIL if iOS missing web chart regions.

## Re-test

_Pending after implementation — see TR-002b._
