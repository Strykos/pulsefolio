# Pulsefolio Agent Steering

Agent prompt templates live in `agents/`. Cursor rule: `.cursor/rules/mockup-agent-qa.mdc` (always apply).

## UI / visual work (mandatory)

For screens, redesigns, or visual polish:

1. **Mockup first** — high-fidelity mockup approved by product owner before code.
2. **PM agent** (`agents/project-manager.md`) — visual acceptance criteria + FAIL blockers from mockup.
3. **Senior Developer agent** (`agents/senior-developer.md`) — implement only against PM criteria.
4. **Senior Design Reviewer** (`agents/senior-design-reviewer.md`) — screenshot vs mockup; **PASS required** (visual sign-off; user is not QA).
5. **Tester agent** (`agents/tester.md`) — smoke tests + functional accuracy; **PASS required**.

**Iterate** Developer → Design Reviewer → Tester until **both** PASS. Do not mark complete or show the user until then.


Approved mockups: `docs/mockups/` or `.cursor/projects/.../assets/`.

## Non-UI work

| Agent | File | Gate |
|-------|------|------|
| **profitcheck** | `agents/profitcheck.md` | Daily P&L watch → fix → merge → verify deploy |
| PM | `agents/project-manager.md` | Story approved before dev |
| Architect | `agents/senior-architect.md` | Spec before implementation |
| Developer | `agents/senior-developer.md` | One story per PR |
| Tester | `agents/tester.md` | TR-xxx before merge |
| CI/CD | `agents/cicd-specialist.md` | Green CI |

## profitcheck (daily)

- Schedule: GitHub Actions `.github/workflows/profitcheck.yml` cron `0 13 * * *` UTC
- Checker: `python3 scripts/profitcheck.py`
- Reports: `docs/profitcheck/latest.json`
- Cursor Automation setup: `docs/agents/profitcheck-automation.md`
- On FAIL: open issue, launch cloud agent (if `CURSOR_API_KEY`), fix auto-trader/AI, merge, confirm Render

See `docs/agent-workflow-log.md` for execution log and release gates.
