# DR-007 — iOS Option B Post-Fix Re-Review

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10  
**Prior:** DR-006 FAIL  
**Screenshots:** `docs/test-reports/ios-screens/01-briefing.png`, `02-portfolio.png`

## VERDICT: **FAIL** (improved, not PASS)

Black patch regression from DR-006 is **fixed**. Mockup glow, charts, status strip, and tile art are visible again. **Ghost text** from baked mockup PNG still bleeds through several live-data slots.

---

## What improved (DR-006 → DR-007)

| Region | Was | Now |
|--------|-----|-----|
| Briefing 2×2 tiles | Solid black blocks | Mockup gauges/donut visible |
| Portfolio status strip | Covered | **PASS** — STOCK/ETF/CRYPTO/BOND visible |
| Portfolio masonry | Large black pills | Smaller in-paint labels |
| Decision hero | Black donut masks | Mockup energy flow visible |

## Remaining FAIL regions

| Region | Issue |
|--------|-------|
| Briefing header | Ghost `$46,764` under live `$148K` |
| Briefing glass card | Mockup `+1.24%` bleeds beside live `-0.66%` |
| Briefing AI strip | Mockup `Add 10 VTI` visible under live BND line |
| Briefing confidence | Mockup `78%` visible; live `95%` not fully in-painting |
| Portfolio tiles | Demo dollar amounts ghost under live labels |

## Root cause (architectural)

Approved PNGs contain **baked demo text**. Micro-overlays cannot guarantee clean in-paint without **text-stripped mockup assets** (background-only PNGs for data regions).

## Required for PASS

1. Produce **data-slot-clean** mockup variants (no baked numbers in overlay regions), OR
2. Calibrate overlays to 100% obscure baked glyphs (pixel-tuned per device size), then re-capture.

## Sign-off

**FAIL** — closer to mockup, live data works, but not delivery-ready per arm's-length rule.
