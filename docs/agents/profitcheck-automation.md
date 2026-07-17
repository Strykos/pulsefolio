# Cursor Automation: profitcheck

Register this once at [cursor.com/automations/new](https://cursor.com/automations/new)
(or Agents Window → Automations). After it exists, daily runs are hands-free.

## Settings

| Field | Value |
|-------|-------|
| Name | `profitcheck` |
| Trigger | Scheduled — cron `0 13 * * *` (UTC) |
| Repository | `Strykos/pulsefolio` @ `main` |
| Tools | Pull request creation (on), Computer use (on), Memories (on) |
| Model | Default / Max Mode (automations always Max) |

## Instructions

Paste the prompt template from [`agents/profitcheck.md`](../../agents/profitcheck.md).

## GitHub secrets (recommended)

| Secret | Purpose |
|--------|---------|
| `CURSOR_API_KEY` | Lets `.github/workflows/profitcheck.yml` launch a cloud agent on FAIL |
| `RENDER_DEPLOY_HOOK_URL` | Explicit Render redeploy from Deploy API / profitcheck workflows |

Render already auto-deploys from `main` when the GitHub blueprint is connected; the hook is a belt-and-suspenders kick.

## Dual runner

1. **GitHub Actions** `profitcheck` cron — always measures P&L, stores `docs/profitcheck/latest.json`, opens issues on FAIL.
2. **Cursor Automation** `profitcheck` — on the same schedule (or when launched by Actions), edits code, merges, verifies deploy.

Either path alone works; together they cover measurement + autonomous remediation.
