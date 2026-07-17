"""Unit tests for scripts/profitcheck.py decision rules."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[3] / "scripts" / "profitcheck.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("profitcheck", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture()
def profitcheck():
    return _load_module()


def test_evaluate_pass(monkeypatch, profitcheck):
    payloads = {
        "/api/v1/health": {"status": "ok", "version": "0.1.0"},
        "/api/v1/public/dashboard": {
            "portfolio": {
                "totalValue": 150000,
                "dayChange": 100,
                "dayChangePercent": 0.5,
                "riskScore": 5,
                "riskLabel": "Balanced",
                "allocations": [
                    {"label": "Stocks", "percent": 30},
                    {"label": "Cash", "percent": 10},
                ],
            },
            "recommendation": {
                "action": "HOLD",
                "analysisAgeSeconds": 60,
                "guardrailEvidence": {"promptVersion": "portfolio-decision-v2"},
            },
            "pendingTrades": 0,
        },
        "/api/v1/public/portfolio": {
            "assetClasses": [
                {
                    "positions": [
                        {"symbol": "VTI", "value": 30000},
                        {"symbol": "AAPL", "value": 25000},
                    ]
                }
            ]
        },
        "/api/v1/public/trades": [],
    }

    def fake_get(url: str, timeout: float = 45.0):
        for suffix, body in payloads.items():
            if url.endswith(suffix):
                return body
        raise AssertionError(url)

    monkeypatch.setattr(profitcheck, "_get", fake_get)
    report = profitcheck.evaluate("https://example.test")
    assert report["status"] == "PASS"
    assert report["remediationFlags"] == []


def test_evaluate_fail_concentration_and_cash(monkeypatch, profitcheck):
    payloads = {
        "/api/v1/health": {"status": "ok"},
        "/api/v1/public/dashboard": {
            "portfolio": {
                "totalValue": 100000,
                "dayChange": -50,
                "dayChangePercent": -0.2,
                "allocations": [
                    {"label": "Stocks", "percent": 40},
                    {"label": "Cash", "percent": 3},
                ],
            },
            "recommendation": {
                "action": "REBALANCE_BUY",
                "analysisAgeSeconds": 99999,
                "guardrailEvidence": {"promptVersion": "portfolio-decision-v1"},
            },
            "pendingTrades": 3,
        },
        "/api/v1/public/portfolio": {
            "assetClasses": [
                {"positions": [{"symbol": "AAPL", "value": 40000}]}
            ]
        },
        "/api/v1/public/trades": [
            {"status": "pending", "mode": "auto", "symbol": "VTI"},
            {"status": "pending", "mode": "auto", "symbol": "VTI"},
            {"status": "pending", "mode": "auto", "symbol": "VTI"},
        ],
    }

    def fake_get(url: str, timeout: float = 45.0):
        for suffix, body in payloads.items():
            if url.endswith(suffix):
                return body
        raise AssertionError(url)

    monkeypatch.setattr(profitcheck, "_get", fake_get)
    report = profitcheck.evaluate("https://example.test")
    assert report["status"] == "FAIL"
    flags = set(report["remediationFlags"])
    assert "cash_below_floor" in flags
    assert "concentration_breach" in flags
    assert "negative_day_pnl" in flags
    assert "stuck_pending_auto_trades" in flags
    assert "stale_recommendation" in flags
    assert "legacy_prompt_version" in flags
