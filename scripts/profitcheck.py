#!/usr/bin/env python3
"""Pulsefolio profitcheck — live portfolio health + P&L gate.

Exit codes:
  0 = PASS (healthy / profitable enough)
  1 = FAIL (remediation required)
  2 = transport / unexpected error
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_API = "https://pulsefolio-api.onrender.com"
MIN_CASH_PERCENT = 5.0
MAX_SINGLE_ASSET_PERCENT = 25.0
MAX_PENDING_AUTO = 0
MAX_REC_AGE_SECONDS = 15 * 60


def _get(url: str, timeout: float = 45.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "pulsefolio-profitcheck/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _alloc_percent(allocations: list[dict], label: str) -> float | None:
    for row in allocations or []:
        if row.get("label") == label:
            return float(row.get("percent") or 0.0)
    return None


def evaluate(api_base: str) -> dict[str, Any]:
    api_base = api_base.rstrip("/")
    flags: list[str] = []
    notes: list[str] = []

    health = _get(f"{api_base}/api/v1/health")
    if health.get("status") != "ok":
        flags.append("api_unhealthy")

    dashboard = _get(f"{api_base}/api/v1/public/dashboard")
    portfolio = dashboard.get("portfolio") or {}
    recommendation = dashboard.get("recommendation")
    pending = int(dashboard.get("pendingTrades") or 0)

    day_pct = float(portfolio.get("dayChangePercent") or 0.0)
    day_change = float(portfolio.get("dayChange") or 0.0)
    total_value = float(portfolio.get("totalValue") or 0.0)
    cash_pct = _alloc_percent(portfolio.get("allocations") or [], "Cash")
    if cash_pct is None:
        cash_pct = 0.0

    # Single-asset concentration must use position weights, not asset-class totals.
    max_position_pct = 0.0
    max_position_symbol = ""
    try:
        portfolio_view = _get(f"{api_base}/api/v1/public/portfolio")
        for asset_class in portfolio_view.get("assetClasses") or []:
            for pos in asset_class.get("positions") or []:
                value = float(pos.get("value") or 0.0)
                weight = (value / total_value * 100.0) if total_value else 0.0
                if weight > max_position_pct:
                    max_position_pct = weight
                    max_position_symbol = str(pos.get("symbol") or "")
    except Exception as exc:  # noqa: BLE001 — report continues with dashboard data
        notes.append(f"portfolio_view_partial:{type(exc).__name__}")

    trades = _get(f"{api_base}/api/v1/public/trades")
    pending_auto = sum(
        1
        for t in trades
        if t.get("status") == "pending" and t.get("mode") == "auto"
    )
    # Public view may map cancelled -> dismissed; count raw pending too.
    pending_any = sum(1 for t in trades if t.get("status") == "pending")

    rec_age = None
    prompt_version = None
    rec_action = None
    if isinstance(recommendation, dict):
        rec_age = recommendation.get("analysisAgeSeconds")
        rec_action = recommendation.get("action")
        prompt_version = (recommendation.get("guardrailEvidence") or {}).get(
            "promptVersion"
        )

    if pending > MAX_PENDING_AUTO or pending_auto > MAX_PENDING_AUTO or pending_any > 0:
        flags.append("stuck_pending_auto_trades")
    if cash_pct < MIN_CASH_PERCENT:
        flags.append("cash_below_floor")
    if max_position_pct > MAX_SINGLE_ASSET_PERCENT:
        flags.append("concentration_breach")
    if day_pct < 0:
        flags.append("negative_day_pnl")
    if rec_age is not None and int(rec_age) > MAX_REC_AGE_SECONDS and rec_action not in (
        None,
        "HOLD",
    ):
        flags.append("stale_recommendation")
    if prompt_version and prompt_version == "portfolio-decision-v1":
        flags.append("legacy_prompt_version")

    status = "FAIL" if flags else "PASS"
    return {
        "agent": "profitcheck",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "apiBase": api_base,
        "status": status,
        "remediationFlags": flags,
        "notes": notes,
        "metrics": {
            "health": health.get("status"),
            "totalValue": total_value,
            "dayChange": day_change,
            "dayChangePercent": day_pct,
            "cashPercent": cash_pct,
            "maxPositionPercent": round(max_position_pct, 2),
            "maxPositionSymbol": max_position_symbol,
            "pendingTrades": pending,
            "pendingAutoTrades": pending_auto,
            "pendingAny": pending_any,
            "recommendationAction": rec_action,
            "recommendationAgeSeconds": rec_age,
            "promptVersion": prompt_version,
            "riskScore": portfolio.get("riskScore"),
            "riskLabel": portfolio.get("riskLabel"),
        },
        "passCriteria": {
            "apiHealthy": True,
            "dayChangePercentNonNegative": True,
            "cashPercentAtLeast": MIN_CASH_PERCENT,
            "maxSingleAssetAtMost": MAX_SINGLE_ASSET_PERCENT,
            "pendingAutoAtMost": MAX_PENDING_AUTO,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Pulsefolio daily profitcheck")
    parser.add_argument("--api-base", default=DEFAULT_API)
    parser.add_argument(
        "--write",
        type=Path,
        help="Directory to write latest.json and runs/<date>.json",
    )
    parser.add_argument(
        "--fail-on-flags",
        action="store_true",
        default=True,
        help="Exit 1 when remediation flags are present (default)",
    )
    args = parser.parse_args()

    try:
        report = evaluate(args.api_base)
    except urllib.error.HTTPError as exc:
        print(json.dumps({"status": "ERROR", "error": f"HTTP {exc.code}"}, indent=2))
        return 2
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"status": "ERROR", "error": str(exc)}, indent=2))
        return 2

    text = json.dumps(report, indent=2)
    print(text)

    if args.write:
        args.write.mkdir(parents=True, exist_ok=True)
        runs = args.write / "runs"
        runs.mkdir(parents=True, exist_ok=True)
        (args.write / "latest.json").write_text(text + "\n", encoding="utf-8")
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        (runs / f"{stamp}.json").write_text(text + "\n", encoding="utf-8")

    if args.fail_on_flags and report["status"] == "FAIL":
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
