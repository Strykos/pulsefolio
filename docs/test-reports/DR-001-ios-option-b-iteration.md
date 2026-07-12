# DR-001 — iOS Option B design review (iteration 0 — baseline)

**Date:** 2026-07-10  
**Reviewer:** Senior Design Reviewer (Agent 5)  
**Mockup:** `pulsefolio-ios-option-b-briefing.png`  
**Screenshot:** `ios-screens/01-briefing.png`  
**VERDICT:** **FAIL**

## Region scores

| Region | Verdict | Gap |
|--------|---------|-----|
| Header brand | PARTIAL | Sparkle present; composition looser than mockup |
| Hero chart | **FAIL** | Value above chart; mockup integrates value + chart as one stage |
| Floating glass card | PARTIAL | Present but placement/opacity weaker than mockup |
| Timeframe pills | PASS | 7 pills, 30D active |
| AI Decision strip | **FAIL** | Border glow too weak; not "neon" like mockup |
| Allocation tile | PARTIAL | Donut OK; "6" + "Assets" two-line vs mockup "5 Assets" single feel |
| Risk gauge tile | PASS | Needle gauge present |
| Confidence tile | PARTIAL | Ring smaller than mockup |
| Drift tile | PASS | Sparkline + warning |
| Bottom nav + CTA | PASS | 3-tab + Approve Trade |

## Top fixes (Developer — iteration 1)

1. Restructure hero: portfolio value + delta **overlaid inside** chart area (bottom-left), not above pills
2. AI strip: `shadow(color: gain, radius: 20)` + brighter border `gain.opacity(0.8)`
3. Increase confidence ring to 88pt diameter
4. Portfolio: full-screen push navigation, not sheet with Done chrome
5. Decision Review: remove duplicate bottom Approve from nav bar; use only mockup footer (Approve / Adjust / Dismiss)
6. Decision: add `EnergyFlowView` between donuts (gradient curved path + glow)
7. Briefing chart: increase plot height to ~55% of above-fold content

## Sign-off

**Not signed off.** Re-review after DR-001 fixes as DR-002.
