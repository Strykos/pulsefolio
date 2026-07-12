# US-IOS-OPTION-B — iOS Immersive Hero mockup fidelity

**Priority:** P0  
**Approved mockups:**
- `pulsefolio-ios-option-b-briefing.png`
- `pulsefolio-ios-option-b-decision.png`
- `pulsefolio-ios-option-b-portfolio.png`

**Reference FAIL report:** `docs/test-reports/TR-003b-tester-audit.md`

## Story

As a product owner, I need the iOS app to match the approved Option B mockups pixel-region fidelity so Tester PASS is required before delivery.

## P0 Acceptance criteria — Morning Briefing

- [ ] **AC-B01** Brand header: Pulsefolio logo + wordmark left, screen subtitle, blue sparkle top-right, Live dot + PAPER pill
- [ ] **AC-B02** Hero area chart (not thin line only) with value + day change overlaid on chart
- [ ] **AC-B03** Floating glass card **inside** chart bounds: sparkle + "+X% Today" + Live + PAPER
- [ ] **AC-B04** Timeframe pills: 1D, 7D, 30D, 3M, YTD, 1Y, ALL (30D default active)
- [ ] **AC-B05** X-axis Jul date labels; Y-axis $K labels on chart right
- [ ] **AC-B06** AI Decision strip: neon teal glow border, trend icon, "Rebalance: Add 10 {symbol}" with symbol highlighted
- [ ] **AC-B07** 2×2 tiles: Allocation centered donut "N Assets"; Risk semi-circular gauge + needle; Confidence large ring; Drift orange sparkline
- [ ] **AC-B08** "Swipe up for evidence" affordance above bottom nav
- [ ] **AC-B09** Bottom nav: 3 segments Briefing | Review | Activity + large green "Approve Trade" button (not 5-tab bar on this screen)
- [ ] **AC-B10** Swipe-up / sheet presents evidence charts (drift, cash floor, concentration)

## P0 Acceptance criteria — AI Decision Review

- [ ] **AC-D01** Brand header with Live + PAPER toggle pill
- [ ] **AC-D02** Headline "Add 10 {symbol}" compact; "Lower risk X → Y" subline (Y < X when risk improves)
- [ ] **AC-D03** Large before/after donuts with glowing energy flow between them
- [ ] **AC-D04** Hero metric orbs: Confidence, Expected Return, Guardrails 3/3 Pass
- [ ] **AC-D05** Position Impact table: ASSET, BEFORE, AFTER, CHANGE, $ CHANGE (≥5 rows)
- [ ] **AC-D06** Evidence sparklines: allocation drift, cash floor, concentration
- [ ] **AC-D07** Risk gauge arc 8.0→7.2 style in sheet; Rebalance Impact bullets; Guardrails checklist
- [ ] **AC-D08** Bottom: Approve paper trade (primary), Adjust + Dismiss secondary buttons

## P0 Acceptance criteria — Portfolio X-Ray

- [ ] **AC-P01** Brand header: Pulsefolio + "Portfolio X-Ray" + Live
- [ ] **AC-P02** Summary card: total value + green delta left; small allocation donut "N ASSETS" right
- [ ] **AC-P03** Masonry hero grid: 2 large + 3 smaller glowing asset cards with symbol logos
- [ ] **AC-P04** Horizontal status strip: STOCK, ETF, CRYPTO, BOND with drift/on-track states
- [ ] **AC-P05** Holdings Preview list with sparklines, shares, value, % badge + "View all"
- [ ] **AC-P06** Bottom: "Rebalance with AI" teal pill + filter/settings icon button

## P1 (non-blocking for TR-003c PASS)

- [ ] Insights and Settings screens: Observatory palette; reachable from header menu without altering P0 screen bottom chrome

## FAIL blockers (Tester must FAIL if any present)

1. BLK-01 No Pulsefolio brand header on P0 screens
2. BLK-02 Risk tile not a gauge with needle
3. BLK-03 Allocation tile donut not centered with asset count
4. BLK-04 Drift tile missing orange sparkline
5. BLK-05 Briefing uses 5-tab bar instead of 3-segment + Approve Trade
6. BLK-06 Decision missing Position Impact table
7. BLK-07 Decision missing Guardrails 3/3 orb + energy flow
8. BLK-08 Portfolio missing masonry treemap hero with logos
9. BLK-09 Portfolio missing asset-class status strip
10. BLK-10 Portfolio missing Holdings Preview with sparklines

## Files expected to change

- `apps/ios/Pulsefolio/Components/OptionBViews.swift` (new)
- `apps/ios/Pulsefolio/Components/ImmersiveObservatoryViews.swift`
- `apps/ios/Pulsefolio/Views/MainTabView.swift`

## Tester gate

TR-003c: side-by-side mockup vs `docs/test-reports/ios-screens/` — **PASS required** before user delivery.
