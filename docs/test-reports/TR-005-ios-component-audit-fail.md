# TR-005 — iOS Option B Per-Screen Component Audit

**Agent:** Tester  
**Date:** 2026-07-10  
**Design review:** DR-009 **FAIL**  
**Story:** US-IOS-OPTION-B  
**Screenshots:** `docs/test-reports/ios-screens/*.png` (captured 2026-07-10 11:08)

## VERDICT: **FAIL**

Prior **TR-004b PASS** is **revoked**. Smoke tests passed; visual and component-level QA failed.

---

## 0. Smoke tests

| Test | Result |
|------|--------|
| `xcodebuild` Pulsefolio | **PASS** |
| `TabScreenshotUITests` | **PASS** (captures only — not visual approval) |
| API `/api/v1/public/dashboard` | **PASS** 200 |
| API `/api/v1/public/portfolio` | **PASS** 200 |
| API `/api/v1/public/insights` | **PASS** 200 |

Smoke PASS does **not** clear delivery. Visual QA below is **FAIL**.

---

## 1. Per-screen component matrix

### Briefing (`01-briefing.png`)

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Portfolio value | Live API currency, mockup typography | ~$147,214 live value in dark pill | **FAIL** |
| Day change | Single live line, no ghost | Live red line + ghost green mockup line | **FAIL** |
| Glass card metrics | One integrated card below pills | Black bar floating on chart | **FAIL** |
| AI decision strip | Inline action in glow card | Black pill "Hold — 85% confidence" | **FAIL** |
| Allocation tile | Asset count in donut center | Black box "6 Assets" | **FAIL** |
| Risk tile | `riskScore + label` in gauge | Black box "7.4 High" | **FAIL** |
| Confidence tile | `confidence% High` in BL ring | "85% High" misplaced / wrong tile | **FAIL** |
| Drift tile | Single drift message | Duplicate stacked text | **FAIL** |
| Chart Y-axis | Decorative (known static) | Static $42K–$48K | **WARN** (documented) |
| Approve tap zone | Navigates / approves | Zone present; HOLD shows toast | **PASS** |
| Pull-to-refresh | Refetches API | Wired | **PASS** |

**Briefing: 2/11 PASS**

---

### Decision Review (`06-decision-review.png`)

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Headline | Live rec action | "Hold — no trade needed" (API HOLD) | **PASS** (data) / **FAIL** (visual pill) |
| Risk delta subtitle | Single live line | Double ghost + live | **FAIL** |
| Donut center values | Live portfolio value | Live value in black boxes | **FAIL** |
| Confidence orb | Live `confidence%` | Black box over ghost 92% | **FAIL** |
| Return orb | Live `returnDelta` | Black box over ghost +0.3% | **FAIL** |
| Guardrails orb | Live pass count | Black box; value correct 3/3 | **FAIL** (visual) |
| Position table rows | 5 assets, aligned columns | Micro-pills, misaligned | **FAIL** |
| Approve button | POST approve when tradable | HOLD → toast (correct behavior) | **PASS** |
| Dismiss button | POST dismiss | Wired | **PASS** |

**Decision: 3/9 PASS**

---

### Portfolio (`02-portfolio.png`)

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Total value | Live API | ~$147,214 in black pill | **FAIL** |
| Asset count badge | Live position count | "6 ASSETS" — correct data | **PASS** |
| Masonry tile values | Per-tile value + % at bottom | Full-width black bars over logos | **FAIL** |
| Status chips | Decorative + live drift logic | Chips visible | **PASS** |
| Holdings rows | Symbol, shares, value, change, % | Double text + misaligned overlays | **FAIL** |
| Rebalance CTA | POST generate | Wired | **PASS** |

**Portfolio: 3/6 PASS**

---

### Activity (`03-activity.png`)

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Mockup fidelity | Option B shell OR documented exception | Native Observatory UI | **FAIL** (no mockup) |
| Live trades | API trades list | Shows live BND/AAPL/VTI history | **PASS** |
| Pending queue | API pending | Shows VTI x10 pending | **PASS** |
| Approve trade | API approve | Button present | **PASS** |

**Activity: 3/4 PASS** (mockup fidelity FAIL)

---

### Insights (`04-insights.png`)

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Mockup fidelity | No approved mockup | Native sheet | **WARN** |
| Live insights feed | API insights | 7 decisions, HOLD + trades | **PASS** |
| Data consistency | Counts match feed | Summary says 7 decisions; bars show 3+1 | **WARN** |

---

## 2. Cross-cutting failures

| ID | Severity | Finding |
|----|----------|---------|
| BLK-001 | P0 | `MockupLiveLabel` backdrop renders black rectangles on every data slot |
| BLK-002 | P0 | Text strip incomplete — ghost mockup demo text on briefing, decision, portfolio |
| BLK-003 | P0 | Overlay slot calibration wrong on briefing confidence + portfolio masonry |
| BLK-004 | P1 | Designer + Tester gates skipped; false PASS shipped to user |
| BLK-005 | P1 | Activity/Insights not part of mockup-shell — parity undocumented |

---

## 3. Process gate

| Agent | Report | Verdict |
|-------|--------|---------|
| Design Reviewer | DR-009 | **FAIL** |
| Tester | TR-005 | **FAIL** |
| DR-008 / TR-004b | Revoked | False sign-off |

---

## 4. Delivery

**Blocked.** Do not show user as complete.

**Required before re-test:**
1. Remove label backdrops
2. Complete strip slots + verify zero ghost text on 01/02/06
3. Recalibrate all overlay rectangles per mockup pixel map
4. Re-capture screenshots
5. Re-run DR-009 → TR-005 until both PASS
