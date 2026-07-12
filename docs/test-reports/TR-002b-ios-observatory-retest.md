# TR-002b — iOS Observatory re-test (after remediation)

**Date:** 2026-07-10  
**Prior report:** TR-002 (FAIL)  
**Tester verdict:** **PASS** (Briefing parity with web chart regions)

## Smoke tests

| Check | Result |
|-------|--------|
| `xcodebuild` Pulsefolio / iPhone 17 Simulator | PASS |
| `ios-run.sh` install + launch | PASS |
| Simulator screenshot | `TR-002b-ios-briefing.png` |

## Cross-platform parity (Briefing)

| Criterion | Web | iOS (after fix) | Result |
|-----------|-----|-----------------|--------|
| Large trend chart (`ObservatoryHeroView` / `PremiumTrendChart`) | Yes | Yes | PASS |
| Evidence rail (drift / cash / concentration) | Yes | Yes (horizontal scroll) | PASS |
| Metric gauges (risk / return / confidence) | Yes | Yes | PASS |
| Guardrail panels with pass/review | Yes | Yes | PASS |
| Allocation donut | Yes | Yes (`DonutHeroView`) | PASS |
| Premium components wired | N/A | Yes | PASS |

## Process fix

- Updated `agents/tester.md` and `.cursor/rules/mockup-agent-qa.mdc`: **FAIL on xcodebuild-only**; mandatory iOS vs web chart-region parity check.

## Notes

- iOS uses vertical scroll (mobile); web uses 3-column grid (desktop). Parity is **chart regions present**, not pixel-identical layout.
- Portfolio / Activity / Insights / Settings received secondary chart widgets (donut, evidence, circular metrics, risk gauge).
