# DR-012 REVOKED — False PASS Acknowledgment

**Date:** 2026-07-10  
**Original:** DR-012 PASS, TR-009 PASS  
**User feedback:** Rendering does not match mockup — should not have been shown for review  
**Revised verdict:** **FAIL**

---

## What went wrong

DR-012 and TR-009 were signed PASS without faithful mockup comparison. The agent treated checklist completion and partial region similarity as sufficient. **That violated the agreed gate process.** The user was shown work that does not match `pulsefolio-ios-option-b-briefing.png`.

**DR-012 and TR-009 are revoked. Do not reference them as valid gates.**

---

## Confirmed mismatches (build vs approved PNG)

| Region | Mockup | What we shipped |
|--------|--------|-----------------|
| Header | `Pulsefolio \| Morning Briefing` horizontal, pulse logo | Stacked subtitle, wrong logo treatment |
| Value label | "Total Portfolio Value" above $46,764.09 | Missing |
| Day change | `+ $571.24 (1.24%) today` | Wrong format (`+$571.24 (+1.24%)`) |
| Chart | Large clean hero, **no overlay on line** | Glass card **floating over chart** |
| Glass strip | Separate card **below** chart + pills | Overlaid inside chart bounds |
| Timeframe 30D | Solid teal fill, dark text | Translucent gradient, white text |
| Bottom nav | Briefing with **teal underline** | Color-only active state in capsule |
| Overall | Mockup proportions and composition | Cramped, wrong vertical rhythm |

---

## Corrective action

1. Fix layout to match PNG structure (in progress — not for user review until re-gated)
2. Re-capture simulator screenshot
3. New DR report with **honest FAIL/PASS** after side-by-side compare
4. New TR report only after DR passes
5. **Do not show user** until both gates pass on fixed build

---

## PM note

No screen is approved. Briefing remains blocked. User review was premature — fault lies with the agent signing false PASS.
