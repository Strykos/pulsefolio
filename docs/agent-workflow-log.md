# Agent Workflow — Execution Log

This documents when each agent role was executed and its deliverable.

| Agent | Role | Deliverable | Status | Path |
|-------|------|-------------|--------|------|
| 1 | Project Manager | Requirements v0.1 | Done (initial) | `docs/requirements/v0.1.md` |
| 1 | Project Manager | Testing gate review | **Done (remediated)** | `docs/requirements/PM-GATE-001-testing-signoff.md` |
| 2 | Architect | ADR-001/002/003, OpenAPI, DB schema | Done | `docs/architecture/` |
| 3 | Developer | Implementation | Done (bulk — process debt) | codebase |
| 4 | Tester | TR-001 validation report | **Done (remediated)** | `docs/test-reports/TR-001-v1-validation.md` |
| 5 | CI/CD | GitHub workflows | Partial | `.github/workflows/` |

## Gate rules (enforced going forward)

1. **Developer** cannot merge without **Tester** report (TR-xxx)
2. **Tester** report must exist before **PM** sign-off (PM-GATE-xxx)
3. **PM** blocks v1 release if any P0 story is HOLD or FAIL
4. Run `scripts/smoke-test.sh` before every PM review

### UI / visual gate (mockup + agent QA)

Steering: `AGENTS.md`, `.cursor/rules/mockup-agent-qa.mdc`, `agents/project-manager.md`, `agents/tester.md`, `agents/senior-developer.md`

1. **Mockup approved** by product owner before implementation
2. **PM agent** — visual acceptance criteria + FAIL blockers from mockup
3. **Developer agent** — build only against PM criteria; no self-approval
4. **Tester agent** — screenshot at ≥1280px vs mockup; **PASS required** before user is told work is done
5. On visual FAIL: fix blockers, re-run Tester — no "good enough" handoffs

### Smoke tests (mandatory — no slipups)

Tester must **FAIL** if skipped or failing:

- **Web:** `npm run build` in `apps/web` exits 0; `http://localhost:3000/` and changed routes return **200** (not 500 / "Internal Server Error")
- **API:** `pytest services/api/tests -q` passes
## iOS Option B rebuild (2026-07-10)

PM `US-IOS-OPTION-B` → OptionBViews + MainTabView rebuild.

**Gate status (2026-07-10 PM):**
- DR-011 / TR-007 — **REVOKED** (false PASS, user rejected visual)
- DR-012 / TR-009 — **REVOKED** (false PASS, user rejected visual)
- DR-013 — **FAIL** (honest re-run)
- TR-010 — **FAIL** (honest re-run)
- **No valid PASS** on iOS Option B briefing as of 2026-07-10

**Process failure:** Design Reviewer and Tester roles exist as `agents/*.md` prompts but were **not run as separate agents** — main chat self-signed DR/TR markdown. Going forward: explicit DR pass → explicit TR pass in separate steps before user handoff.

API-only or file-read verification is **not** sufficient for web UI PASS.

## How to run validation

```bash
# Terminal 1 — API
cd services/api && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Web (do NOT run build while dev is up)
cd apps/web && npm run dev -- --port 3001

# Terminal 3 — Smoke test
./scripts/smoke-test.sh
```
