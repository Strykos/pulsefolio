# DR-006 — iOS Option B Mockup Shell + Live Overlays

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10  
**Approved mockups:** `apps/ios/Pulsefolio/Resources/Mockups/pulsefolio-ios-option-b-*.png`  
**Screenshots:** `docs/test-reports/ios-screens/01-briefing.png`, `02-portfolio.png`, `06-decision-review.png`  
**PM spec:** `docs/requirements/US-IOS-OPTION-B.md`

## VERDICT: **FAIL**

Arm's-length comparison: implementation does **not** match approved mockups. Large opaque overlay patches destroy the mockup visuals. This is not the design the product owner approved.

---

## Region scores (P0)

| Region | Screen | Score | Issue |
|--------|--------|-------|-------|
| Header brand | Briefing | PASS | Mockup PNG intact |
| Hero chart composition | Briefing | **FAIL** | Black floating card patch covers chart glass card |
| Floating glass card | Briefing | **FAIL** | Opaque overlay replaces mockup card instead of in-painting text |
| Timeframe pills | Briefing | PASS | From mockup PNG |
| AI strip glow | Briefing | **FAIL** | Black bar over strip text; mockup glow partially obscured |
| 2×2 tile visuals | Briefing | **FAIL** | Solid black tiles replace gauges/donut; wrong metrics in wrong tiles |
| Swipe affordance | Briefing | PASS | Mockup PNG |
| Bottom nav + CTA | Briefing | PASS | Tap zones work; mockup PNG |
| Hero donuts + energy flow | Decision | **FAIL** | Black masks over donut centers and metric orbs |
| Position table | Decision | **FAIL** | Opaque panel over mockup table chrome |
| Footer actions | Decision | PASS | Mockup PNG |
| Summary + donut | Portfolio | **FAIL** | Black header patch; ghost demo values visible |
| Masonry treemap | Portfolio | **FAIL** | Black pills on every tile; mockup logos/glow damaged |
| Asset-class status strip | Portfolio | **FAIL** | Strip replaced/covered by black overlay rows |
| Holdings preview | Portfolio | **FAIL** | Full-width black bars instead of sparkline rows |
| Bottom CTA | Portfolio | PASS | Mockup PNG |

---

## Root cause

`MockupSolidMask` + oversized `MockupMaskedText` slots paint **opaque `#080C10` rectangles** on top of the approved PNG. Visual fidelity is destroyed while attempting live data.

## Developer fix list (priority)

1. **Remove all `MockupSolidMask`** — no full-region opaque patches on mockup PNGs.
2. **Micro-slot overlays only** — mask + text sized to glyph bounds (value line, single tile center), not whole cards.
3. **Fix 2×2 briefing grid mapping** per mockup: TL=Allocation, TR=Risk, BL=Confidence, BR=Drift (was swapped).
4. **Portfolio holdings** — per-field micro labels only; preserve mockup sparkline rows and status strip PNG.
5. **Decision donuts** — do not mask hero art; only replace headline, subline, table numerics.
6. **Re-capture screenshots** after fixes; re-submit to Design Reviewer before user delivery.

## Sign-off

**FAIL** — do not ship to product owner until DR re-run passes.
