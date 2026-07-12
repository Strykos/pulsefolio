# PM-001 — iOS Option B Delivery Status Report

**Role:** Project Manager  
**Date:** 2026-07-10  
**Spec:** `docs/requirements/US-IOS-OPTION-B.md`  
**Approved mockups:** Briefing · Decision · Portfolio (3 P0 screens)

---

## Executive summary

**The iOS Option B app is not done.** Delivery is **~33% complete** on the agreed page-by-page process. Only **Morning Briefing (Phase 1 layout freeze)** has passed honest Design Review + Tester gates under the new workflow. **Decision Review** and **Portfolio X-Ray** have SwiftUI implementations in the repo but have **not** been rebuilt, screenshot-compared, or gated under the current process. **Live API wiring** for briefing is intentionally deferred until layout is user-approved.

| Question | Answer |
|----------|--------|
| Is the app done? | **No** |
| Built and tested everything? | **No** — briefing only (layout freeze) |
| Compared every screen to mockups? | **No** — briefing only |
| Faithfully rendered end-to-end? | **Partial** — briefing layout yes; live data no; other screens unverified |
| Safe to ship? | **No** |

---

## Delivery model (agreed with user)

```
Phase 1  Layout freeze (mock values, no API)
    ↓
Design Review  side-by-side vs PNG → FAIL until pass
    ↓
Tester gate     UITest screenshot + checklist → FAIL until pass
    ↓
User approval   per screen before next screen
    ↓
Phase 5         Wire live API without changing layout
```

Screen order: **Briefing → Decision → Portfolio** (P0). Do not advance without user sign-off.

---

## P0 screen status

### 1. Morning Briefing — **IN REVIEW (user)**

| Item | Status |
|------|--------|
| Phase 1 layout freeze | ✅ Complete |
| Implementation | `OptionBBriefingLayoutScreen` + `OptionBMockupLayoutData` |
| Live API | ❌ Not wired (frozen $46,764.09 mock values) |
| Design Review | ✅ **DR-012 PASS** (2026-07-10) |
| Tester gate | ✅ **TR-009 PASS** (2026-07-10) |
| User approval | ⏳ **Pending** — screenshot at `docs/test-reports/TR-003-ios-immersive-briefing.png` |
| Evidence sheet (AC-B10) | ⚠️ Not re-gated in Phase 1 |

**Valid gates:** DR-012, TR-009  
**Revoked / do not trust:** DR-011, TR-007 (false PASS on live API build with visual mismatch)

---

### 2. AI Decision Review — **NOT STARTED (new process)**

| Item | Status |
|------|--------|
| Phase 1 layout freeze | ❌ Not done |
| Implementation exists | `OptionBReviewScreen` in `MainTabView.swift` (API-driven) |
| Mockup comparison (current process) | ❌ None |
| Design Review | ❌ No valid DR under layout-freeze process |
| Tester gate | ❌ No valid TR under layout-freeze process |
| User approval | ❌ Blocked |

**Stale evidence (untrusted):** `docs/test-reports/ios-screens/06-decision-review.png` (11:48, pre–layout-freeze)

---

### 3. Portfolio X-Ray — **NOT STARTED (new process)**

| Item | Status |
|------|--------|
| Phase 1 layout freeze | ❌ Not done |
| Implementation exists | `OptionBPortfolioView` in `OptionBViews.swift` (API-driven) |
| Mockup comparison (current process) | ❌ None |
| Design Review | ❌ No valid DR under layout-freeze process |
| Tester gate | ❌ No valid TR under layout-freeze process |
| User approval | ❌ Blocked |

**Stale evidence (untrusted):** `docs/test-reports/ios-screens/02-portfolio.png` (11:48, pre–layout-freeze)

---

## P1 / auxiliary screens

| Screen | Status | Notes |
|--------|--------|-------|
| Activity | Built, API-driven | Not P0 mockup scope; no layout-freeze gate |
| Insights | Sheet from header | P1; Observatory palette |
| Settings | Sheet | P1 |

---

## Gate inventory (trust matrix)

| Report | Verdict | Trust for delivery? |
|--------|---------|---------------------|
| DR-012 Briefing layout freeze | PASS | ✅ **Yes** |
| TR-009 Briefing layout freeze | PASS | ✅ **Yes** |
| DR-011 Native Option B | PASS | ❌ Revoked — visual mismatch |
| TR-007 Native Option B | PASS | ❌ Revoked — user rejected |
| DR-009 / DR-010 | FAIL | Historical only |
| TR-003b–e series | Mixed FAIL | Historical only |

**Rule:** Only DR-012 + TR-009 count toward current briefing delivery. All prior PASS reports for Decision/Portfolio are **invalid** until re-run under the same process.

---

## Spec checklist (`US-IOS-OPTION-B.md`)

### Morning Briefing (10 AC)

| AC | Phase 1 layout | Live wire (Phase 5) |
|----|----------------|---------------------|
| AC-B01 – B09 | ✅ Gated PASS (DR-012) | Pending |
| AC-B10 Evidence sheet | ⚠️ Not re-tested Phase 1 | Pending |

### Decision Review (8 AC)

| AC-D01 – D08 | 0/8 gated under current process |

### Portfolio X-Ray (6 AC)

| AC-P01 – P06 | 0/6 gated under current process |

### FAIL blockers BLK-01 – BLK-10

| Blocker | Briefing | Decision | Portfolio |
|---------|----------|----------|-----------|
| BLK-01 Brand header | ✅ | Unverified | Unverified |
| BLK-02 Risk gauge | ✅ | Unverified | N/A |
| BLK-03 Allocation donut | ✅ | Unverified | Unverified |
| BLK-04 Drift sparkline | ✅ | N/A | N/A |
| BLK-05 3-segment nav | ✅ | Unverified | N/A |
| BLK-06 Position table | N/A | Unverified | N/A |
| BLK-07 Guardrails orb | N/A | Unverified | N/A |
| BLK-08 Masonry hero | N/A | N/A | Unverified |
| BLK-09 Status strip | N/A | N/A | Unverified |
| BLK-10 Holdings sparklines | N/A | N/A | Unverified |

---

## What is built in code today

| Component | File | Routed in app? | Data source |
|-----------|------|----------------|-------------|
| Briefing layout freeze | `OptionBBriefingLayoutScreen` | ✅ Default screen | Frozen mock |
| Briefing live (legacy) | `OptionBBriefingScreen` | ❌ Unused | API |
| Decision Review | `OptionBReviewScreen` | ✅ Review tab | API |
| Portfolio X-Ray | `OptionBPortfolioView` | ✅ Overlay route | API |
| Activity | `OptionBActivityScreen` | ✅ Activity tab | API |
| Mockup shell (abandoned) | `OptionBMockupShell` / overlays | ❌ Removed from routing | N/A |

**Build status:** iOS Debug build succeeds on iPhone 17 Simulator (last verified 2026-07-10 12:03).

---

## Risks and open issues

1. **User approval pending** — Briefing shown but explicit approve/reject not recorded.
2. **Two briefing implementations** — Risk of routing regression if someone switches back to `OptionBBriefingScreen`.
3. **Decision/Portfolio false confidence** — Old code + old screenshots may look “done” but were never validated under layout-freeze gates.
4. **Live data gap** — Even after briefing approval, app will show mock $46K until Phase 5 wire (API currently ~$150K + VTI×10).
5. **Web app confusion** — `localhost:3000` is Observatory web, **not** the iOS deliverable.

---

## Recommended next steps (sequenced)

| # | Action | Owner | Blocked by |
|---|--------|-------|------------|
| 1 | User approves or rejects Briefing layout | User | — |
| 2a | If reject: layout-only fixes → DR-013 → TR-010 → re-show | Dev + DR + Tester | User feedback |
| 2b | If approve: Phase 1 Decision layout freeze (`OptionBMockupLayoutData` decision values) | Dev | Step 1 |
| 3 | DR + TR for Decision vs `pulsefolio-ios-option-b-decision.png` | DR + Tester | Step 2b |
| 4 | User approves Decision | User | Step 3 PASS |
| 5 | Phase 1 Portfolio layout freeze | Dev | Step 4 |
| 6 | DR + TR for Portfolio vs `pulsefolio-ios-option-b-portfolio.png` | DR + Tester | Step 5 |
| 7 | User approves Portfolio | User | Step 6 PASS |
| 8 | Phase 5: wire live API to all three screens (data source swap only, no layout edits) | Dev | Steps 1, 4, 7 |
| 9 | Final regression DR + TR on live data | DR + Tester | Step 8 |
| 10 | Delivery sign-off | PM + User | Step 9 PASS |

**Estimated remaining work:** 2 screens × (layout + DR + TR + user gate) + live wire + final regression ≈ **majority of P0 still outstanding**.

---

## PM sign-off

**Delivery status: NOT COMPLETE**

The project has a credible, gated **Briefing Phase 1** candidate awaiting your review. It does **not** constitute full Option B delivery. Decision and Portfolio require the same rigorous page-by-page treatment before any “done” claim.

**Next decision required from you:** Approve or reject the Briefing screen (`TR-003-ios-immersive-briefing.png`).
