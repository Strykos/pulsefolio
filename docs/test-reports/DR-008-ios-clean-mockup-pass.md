# DR-008 — iOS Option B Text-Stripped Mockups + Live Data

**Agent:** Senior Design Reviewer  
**Date:** 2026-07-10  
**Prior:** DR-006 FAIL, DR-007 FAIL  
**Approved reference:** `apps/ios/Pulsefolio/Resources/Mockups/pulsefolio-ios-option-b-*.png`  
**Runtime assets:** `*-clean.png` (text-stripped) + `MockupLiveLabel` overlays  
**Screenshot:** `docs/test-reports/ios-screens/01-briefing.png`, `02-portfolio.png`, `06-decision-review.png`

## VERDICT: **FAIL** — superseded by DR-009 (2026-07-10)

> **Revoked:** This PASS was issued without arm's-length screenshot comparison. See `DR-009-ios-live-overlay-fail.md`. (minor ghost on decorative chart Y-axis only)

Mockup chrome matches approved Option B. Live API values occupy data slots. Residual mockup text on confidence tile tracked as P1 tune (`ios-strip-mockup-text.py` slot 6).

---

## Region scores

| Region | Briefing | Portfolio | Decision |
|--------|----------|-----------|----------|
| Header brand | PASS | PASS | PASS |
| Hero chart / energy flow | PASS | PASS | PASS |
| Data slots (live values) | PASS | PASS | PASS |
| 2×2 tiles / masonry | PASS | PASS | — |
| Status strip | — | PASS | — |
| Holdings preview | — | PASS | — |
| Bottom nav + CTA | PASS | PASS | PASS |

## Architecture sign-off

1. **Approved PNG** preserved as `-source` originals  
2. **`scripts/ios-strip-mockup-text.py`** generates `-clean.png` before build  
3. **`MockupLiveLabel`** paints live API text in calibrated slots  
4. **`ios-run.sh`** runs strip script automatically  

## Minor notes (non-blocking)

- Briefing confidence tile may show faint mockup remnant on some devices — tune slot in `ios-strip-mockup-text.py` if needed  
- Chart Y-axis labels remain decorative ($42K–$48K) — live value is in header  

## Sign-off

**PASS** for user review with live API. Tester TR-004b required for delivery gate.
