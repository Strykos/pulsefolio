# DR-004 — User override + honest re-review (iteration 4)

**Date:** 2026-07-10  
**Reviewer:** Senior Design Reviewer  
**Trigger:** Product owner rejected DR-003 sign-off — "still crap, does not come close"  
**Prior DR-003:** **REVOKED**

## Root cause (why prior PASS was wrong)

1. Reviewer graded **checklist structure**, not arm's-length mockup comparison
2. DR-001 incorrectly moved value *into* chart bottom — mockup has value **above** chart, glass card **inside** chart only
3. Glow/drama treated as "good enough" when mockup uses unconstrained neon bloom
4. Decision layout stacked vertically; mockup uses **table + evidence side-by-side** in one card
5. Portfolio tiles were flat tint boxes; mockup uses **radial inner glow** per asset

## Iteration 4 changes

- Briefing: value row above chart (mockup composition), taller chart, smooth curve + endpoint glow, glass floating card, solid teal pills
- New `OptionBVisualStyle.swift`: neon glow + glass modifiers
- AI strip: gradient fill + outer bloom halo, symbol in blue-teal
- Drift tile: orange-tinted surface
- Decision: 152pt donuts, subtitles, evidence beside table, larger orbs
- Portfolio: radial gradient hero cards with per-asset glow

## VERDICT: **FAIL** (pending owner review)

Closer than iteration 3. Still unlikely to match PNG mockup pixel-bloom. **Do not claim done** until owner confirms or DR-005 PASS.

## Remaining gaps

- Generated mockup neon still exceeds SwiftUI shadow limits on Simulator
- Live API data (BND, $148K) vs mockup demo values ($46K, VTI)
- Decision energy flow still vector paths, not mockup wispy particle streams
- Portfolio X close button not in mockup
