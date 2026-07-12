# TR-006 — iOS P0 Fix Functional + Component Audit

**Agent:** Tester  
**Date:** 2026-07-10  
**Design review:** DR-010 FAIL (improved)  
**Screenshots:** `docs/test-reports/ios-screens/*.png` (11:18)

## VERDICT: **FAIL** (functional PASS, visual PARTIAL)

---

## 0. Smoke tests

| Test | Result |
|------|--------|
| `ios-strip-mockup-text.py` ghost check | **PASS** (0 ghost pixels all screens) |
| `xcodebuild` | **PASS** |
| Bundle MD5 sync for `-clean.png` | **PASS** |
| `TabScreenshotUITests` | **PASS** |
| API dashboard/portfolio/insights 200 | **PASS** |

---

## 1. Component matrix (post-fix)

### Briefing — **8/11 PASS** (was 2/11)

| Component | Result |
|-----------|--------|
| Portfolio value live | **PASS** |
| Day change live | **PASS** |
| Glass card metrics | **PASS** |
| AI strip (HOLD) | **PASS** |
| Allocation / risk / confidence / drift tiles | **PASS** / **PARTIAL** / **PASS** / **PASS** |
| No opaque label backdrops | **PASS** |
| Chart Y-axis live | **WARN** (static decorative) |

### Portfolio — **5/6 PASS** (was 3/6)

| Component | Result |
|-----------|--------|
| Total value | **PASS** |
| Masonry tiles by symbol | **PASS** (AAPL tile shows AAPL value) |
| Holdings rows | **PASS** |
| Blur artifact bands | **FAIL** (visual) |
| Rebalance CTA | **PASS** |

### Decision — **6/9 PASS** (was 3/9)

| Component | Result |
|-----------|--------|
| HOLD headline | **PASS** |
| Subtitle single line | **PARTIAL** |
| Donut values | **PASS** |
| Metric orbs | **PASS** |
| Position table | **PARTIAL** (readable, blur bands) |
| Approve (HOLD toast) | **PASS** |

### Activity / Insights — unchanged

Native UI, live API data **PASS**; mockup fidelity **N/A**.

---

## 2. Regression checks

| Check | DR-009 | TR-006 |
|-------|--------|--------|
| Black label backdrops | FAIL | **FIXED** |
| Ghost $46K / Add 20 VTI | FAIL | **FIXED** |
| Portfolio tile/list mismatch | FAIL | **FIXED** |
| Stale bundle assets | FAIL | **FIXED** |
| Blur strip side effects | — | **NEW FAIL** |

---

## 3. Process gate

| Agent | Report | Verdict |
|-------|--------|---------|
| Design Reviewer | DR-010 | **FAIL** (improved) |
| Tester | TR-006 | **FAIL** (functional mostly PASS) |

---

## 4. Delivery

**Blocked** for mockup-faithful delivery. Functional live-data wiring is largely correct.

Recommend PM decision: accept blur-inpaint shell with documented limitations, OR fund native SwiftUI slot components for data regions.
