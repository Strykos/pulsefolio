# DR-009 — iOS Option B Mockup-Shell Live Overlay Review

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10  
**Story:** US-IOS-OPTION-B  
**Screenshots:** `docs/test-reports/ios-screens/01-briefing.png`, `02-portfolio.png`, `06-decision-review.png`  
**Approved mockups:** `apps/ios/Pulsefolio/Resources/Mockups/pulsefolio-ios-option-b-{briefing,decision,portfolio}.png`

## VERDICT: **FAIL**

Prior reports **DR-008** and **TR-004b** are **revoked**. They were signed without arm's-length screenshot comparison. This review supersedes them.

---

## Briefing (`01-briefing.png` vs `pulsefolio-ios-option-b-briefing.png`)

| Region | Verdict | Issue |
|--------|---------|-------|
| Header brand | PASS | Logo, title, sparkle present |
| Hero value typography | **FAIL** | Live value sits in opaque dark pill; mockup uses bare white type on chart — no boxes |
| Day change | **FAIL** | Ghost green mockup text (`+$571.24 (1.24%)`) still visible above chart; live red line overlaps |
| Hero chart composition | PASS | Chart weight/glow preserved from mockup chrome |
| Glass performance card | **FAIL** | Black overlay bar floats mid-chart; mockup has integrated glass card below timeframe pills |
| Timeframe pills | PASS | 30D highlight matches |
| AI decision strip | **FAIL** | Black pill over glow card; mockup shows inline teal-highlighted action text, no backdrop |
| Allocation tile | **FAIL** | "6 Assets" in black box; mockup shows centered text inside donut, no rectangle |
| Risk Score tile | **FAIL** | "7.4 High" in black box over gauge; mockup shows "4.2 Moderate" integrated in gauge |
| Confidence tile | **FAIL** | "85% High" renders in wrong tile (allocation column); mockup BL tile only |
| Drift tile | **FAIL** | Duplicate "Allocation drift detected" — mockup text + overlay text stacked |
| Bottom nav + CTA | PASS | Briefing tab + Approve Trade chrome match |

**Briefing P0 count:** 8/11 regions FAIL

---

## Decision Review (`06-decision-review.png` vs `pulsefolio-ios-option-b-decision.png`)

| Region | Verdict | Issue |
|--------|---------|-------|
| Hero headline | PARTIAL | Live "Hold — no trade needed" renders; mockup shows "Add 10 VTI" drama — acceptable if API HOLD, but typography uses overlay pill |
| Risk subtitle | **FAIL** | Double text: live `7.4 → 7.4` over ghost `8.0 → 7.2` from unstripped mockup |
| Donut pair + energy bridge | PASS | Visual chrome preserved |
| Donut center values | **FAIL** | Black backdrop boxes over donut centers; mockup has clean inline currency |
| Metric orbs (confidence/return/guardrails) | **FAIL** | Black boxes cover orb labels; ghost `92% High` / `+0.3%` visible underneath |
| Position impact table | **FAIL** | Every cell is a separate black micro-pill; misaligned rows; unreadable at arm's length |
| Evidence sparklines | PASS | Decorative chrome intact |
| Footer risk gauge | PASS | Gauge chrome visible |
| Footer actions | PASS | Approve / Adjust / Dismiss chrome match |

**Decision P0 count:** 5/9 regions FAIL

---

## Portfolio X-Ray (`02-portfolio.png` vs `pulsefolio-ios-option-b-portfolio.png`)

| Region | Verdict | Issue |
|--------|---------|-------|
| Header + live badge | PASS | |
| Summary value | **FAIL** | Black pill on value; mockup bare white type |
| Allocation donut | PASS | Chrome preserved; "6 ASSETS" overlay acceptable placement |
| Masonry tiles (AAPL/MSFT/VTI/BTC/BND) | **FAIL** | Black bars cut across tile centers obscuring logos; mockup shows value **below** ticker inside tile |
| Status strip (STOCK/ETF/CRYPTO/BOND) | PASS | Decorative chips intact |
| Holdings preview rows | **FAIL** | Double-rendered rows — mockup row text + black overlay bars stacked; columns misaligned |
| Bottom CTA | PASS | Rebalance with AI chrome matches |

**Portfolio P0 count:** 3/7 regions FAIL

---

## Activity & Insights (no approved Option B mockups)

| Screen | Verdict | Note |
|--------|---------|------|
| Activity (`03-activity.png`) | N/A mockup | Native SwiftUI — **not** Option B mockup shell; different design language |
| Insights (`04-insights.png`) | N/A mockup | Native sheet — functional but not mockup-faithful |

---

## Root cause (design)

1. **`MockupLiveLabel` opaque backdrops** — introduced black/dark rectangles not in any approved mockup.
2. **Incomplete text strip** — decision subtitle, glass-card zone, masonry tile interiors, holdings rows still carry ghost demo text.
3. **Overlay coordinates** — briefing confidence tile lands in wrong grid cell; portfolio masonry overlays span full tile width instead of value slot.
4. **No per-screen designer walkthrough** — prior PASS was written from build success, not image comparison.

---

## Required fixes (Developer, prioritized)

1. **P0** — Remove `MockupLiveLabel` opaque backdrops; live text must render as bare type matching mockup weight/color.
2. **P0** — Expand `ios-strip-mockup-text.py` slots for: briefing glass-card row, decision subtitle, portfolio masonry value bands, holdings row cells.
3. **P0** — Recalibrate briefing confidence slot to BL tile center (`x≈0.27, y≈0.754` of mockup image).
4. **P0** — Portfolio masonry: one value line per tile at bottom interior, not full-width bar across logo.
5. **P1** — Decision table: single row band per asset, align to column headers in mockup.
6. **P1** — Briefing glass card: move overlay to below timeframe pills (`y≈0.45`), not over chart.
7. **P2** — Activity: either add approved mockup or document as native exception in US-IOS-OPTION-B.
8. **P2** — Regenerate all screenshots; **do not** mark PASS until this review is re-run.

---

## Gate

**FAIL** — At arm's length this does not match approved Option B mockups. User-visible mistakes confirm.

**Next:** Developer fixes → re-run DR-009 → Tester TR-005.
