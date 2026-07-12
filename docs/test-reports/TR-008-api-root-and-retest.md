# TR-008 — API Root URL + Tester Re-run

**Agent:** Tester  
**Date:** 2026-07-10  
**Trigger:** User opened `http://localhost:8000/` in browser → `{"detail":"Not Found"}`

## VERDICT: **PASS** (after fix)

---

## What went wrong

TR-007 verified iOS hitting `/api/v1/public/dashboard` — **not** the browser root URL.  
`GET /` had no route. FastAPI correctly returned 404. The API was running; the URL was wrong.

This was a **test coverage gap**, not a sleeping API.

---

## Fix applied

- Added `GET /` and `GET /api/v1` landing JSON with links to dashboard, health, docs
- Extended `scripts/smoke-test.sh` to assert root landing + VTI rebalance on dashboard

---

## Re-run results (11:44)

| Check | Result |
|-------|--------|
| `GET http://localhost:8000/` | **PASS** — service info + endpoint links |
| `GET /api/v1/public/dashboard` | **PASS** — live data, VTI × 10 rebalance |
| `pytest test_dashboard_endpoints` | **PASS** |
| `TabScreenshotUITests` | **PASS** — fresh screenshots in `docs/test-reports/ios-screens/` |

---

## User-facing URLs

| URL | What you get |
|-----|----------------|
| http://localhost:8000/ | API landing (links) |
| http://localhost:8000/api/v1/docs | Swagger UI |
| http://localhost:8000/api/v1/public/dashboard | Live JSON dashboard |
| http://localhost:3000 | Web app (run `./scripts/dev-start.sh web`) |
