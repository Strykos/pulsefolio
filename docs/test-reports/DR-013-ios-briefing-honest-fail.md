# DR-013 — iOS Briefing Design Review (Independent Re-run)

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10 16:43  
**Method:** Side-by-side image compare (mockup PNG vs simulator screenshot)  
**Mockup:** `apps/ios/Pulsefolio/Resources/Mockups/pulsefolio-ios-option-b-briefing.png`  
**Screenshot:** `docs/test-reports/ios-screens/briefing-layout-phase1.png`

## VERDICT: **FAIL**

**Safe to show user for review:** **NO**

---

## Per-region results

| Region | Result | Issue |
|--------|--------|-------|
| Header brand | **FAIL** | Mockup: logo + "Pulsefolio" + "Morning Briefing" as subtitle under/beside wordmark. Build: pipe-separated single line — wrong hierarchy and density |
| Hero value block | **PARTIAL** | Values correct; day-change format differs (`▲ $571.24` vs `▲ + $571.24`) |
| Chart composition | **FAIL** | Mockup chart dominates hero (~40% screen); build chart is visibly smaller and flatter |
| Glass summary card | **PARTIAL** | Now below chart (correct position) but missing `+$571.24` on card; sparkle treatment weaker than mockup teal orb |
| Timeframe pills | **PASS** | 30D solid teal with dark text — acceptable |
| AI Decision strip | **PARTIAL** | Copy correct; glow/border drama weaker than mockup thick neon ring |
| Allocation tile | **PASS** | Donut + 5 Assets |
| Risk gauge | **FAIL** | Mockup rainbow arc green→yellow→red with needle; build gauge simpler, less dramatic |
| Confidence ring | **PASS** | 78% High visible |
| Drift tile | **PASS** | Orange border + sparkline + copy |
| Bottom nav + CTA | **PARTIAL** | Underline on Briefing present; Approve button placement/composition differs from mockup (overlaps bar edge) |
| Overall at arm's length | **FAIL** | Same information, different design — user correctly rejected it |

---

## Top fixes (Developer)

1. Increase hero chart height to mockup proportion (~220–240pt) without clipping tiles
2. Restore mockup header layout: logo + stacked Pulsefolio / Morning Briefing (not pipe line)
3. Add `+$571.24` to glass summary card text
4. Strengthen AI Decision outer glow to match mockup neon border weight
5. Upgrade RiskGaugeCompact to full rainbow arc + needle like mockup
6. Match day-change format: `▲ $571.24 (1.24%) today` (no extra `+` before dollar)
7. Re-balance vertical rhythm — mockup has more breathing room in hero, tighter card grid
8. Fix bottom bar layout so Approve sits inline without awkward overlap

---

## Process note

This review was run after DR-012 revocation. Prior PASS was invalid — main agent self-signed without faithful compare.
