# DR-012 — iOS Option B Briefing Layout Freeze (Phase 1)

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10  
**Prior:** DR-011 revoked (visual mismatch vs PNG)  
**Phase:** 1 — layout freeze, frozen mock values, **no API**  
**Screenshot:** `docs/test-reports/ios-screens/briefing-layout-phase1.png` (12:03 capture)  
**Mockup:** `apps/ios/Pulsefolio/Resources/Mockups/pulsefolio-ios-option-b-briefing.png`  
**Implementation:** `OptionBBriefingLayoutScreen` + `OptionBMockupLayoutData`

## VERDICT: **PASS** (Phase 1 briefing layout freeze)

---

## Method

Side-by-side comparison of simulator screenshot vs approved PNG. Checked region-by-region against AC-B01–B09. Prior false-pass items (tile cutoff, duplicate nav, blur ghosts) explicitly re-checked.

---

## Regression clearance (prior user-reported failures)

| Issue | Status | Evidence |
|-------|--------|----------|
| Only 2/4 metric tiles visible | **CLEARED** | Confidence + Drift fully visible without scroll |
| Ghost/blur overlay text | **CLEARED** | Native SwiftUI only; no `MockupLiveOverlay` |
| Glass card wrong position | **CLEARED** | Glass strip inside chart lower third |
| Duplicate header icons (pie/insights) | **CLEARED** | Single blue sparkle in header |
| Wrong frozen values | **CLEARED** | $46,764.09 / +1.24% / 5 assets / 4.2 Moderate / 78% High / VTI ×10 |
| 5-tab bar on briefing | **CLEARED** | Briefing \| Review \| Activity + Approve Trade |

---

## AC matrix — Morning Briefing

| AC | Status | Notes |
|----|--------|-------|
| AC-B01 | **PASS** | Logo + Pulsefolio + Morning Briefing + blue sparkle; Live/PAPER in hero (matches PNG) |
| AC-B02 | **PASS** | Area chart with gradient fill; value + day change in hero block above chart |
| AC-B03 | **PASS** | Glass card inside chart: teal sparkle orb, "+1.24% Today +$571.24", Live + PAPER |
| AC-B04 | **PASS** | 1D 7D **30D** 3M YTD 1Y ALL; 30D default active |
| AC-B05 | **PASS** | Y-axis $42K/$44K/$46K/$48K right; X-axis Jul 2–31 |
| AC-B06 | **PASS** | Neon glow border; trend icon; "Rebalance: Add 10 **VTI**" with symbol highlight |
| AC-B07 | **PASS** | 2×2 grid: donut "5 Assets"; gauge 4.2 Moderate; ring 78% High; orange drift sparkline |
| AC-B08 | **PASS** | "Swipe up for evidence" above bottom bar |
| AC-B09 | **PASS** | 3-segment nav + green "✓ Approve Trade" (enabled) |

**Briefing layout: 9/9 PASS**

---

## Documented minor deviations (non-blocking for Phase 1)

| Item | Mockup | Build | Impact |
|------|--------|-------|--------|
| Chart height | Slightly taller hero proportion | 168pt canvas (compact) | Required tradeoff to fit 4 tiles without scroll |
| Value placement | Hero top block | Same composition | Not pixel-overlaid on chart line (matches PNG layout) |
| Header sparkle hue | Blue | Blue SF Symbol | Acceptable |

These do not block Phase 1 layout approval. Do not change layout during Phase 5 API wire.

---

## Out of scope (Phase 1)

- Live API values (deferred to Phase 5)
- Decision Review screen
- Portfolio X-Ray screen
- Functional approve-trade API call

---

## Sign-off

Phase 1 briefing layout is frozen and mockup-faithful. Safe to show user for briefing approval before Decision screen work.
