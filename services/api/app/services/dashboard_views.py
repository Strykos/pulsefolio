"""Shared dashboard view builders for public demo and authenticated /me routes."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import (
    AIRecommendation,
    AssetClass,
    DecisionEventType,
    Portfolio,
    RecommendationStatus,
    Trade,
    TradeSide,
    TradeStatus,
    User,
    UserSettings,
)
from app.services.market_data import market_data_service
from app.services.portfolio_metrics import portfolio_day_change, portfolio_sparkline
from app.services.risk import compute_risk_assessment
from app.services.simulation import compute_portfolio_state

ALLOCATION_COLORS = {
    AssetClass.STOCK: "#4A9EFF",
    AssetClass.ETF: "#00D4AA",
    AssetClass.BOND: "#F59E0B",
    AssetClass.CRYPTO: "#8B5CF6",
    AssetClass.COMMODITY: "#EC4899",
    AssetClass.CASH: "#8B95A8",
}

ASSET_CLASS_LABELS = {
    AssetClass.STOCK: "Stocks",
    AssetClass.ETF: "ETFs",
    AssetClass.BOND: "Bonds",
    AssetClass.CRYPTO: "Crypto",
    AssetClass.COMMODITY: "Commodities",
    AssetClass.CASH: "Cash",
}


def analysis_details(rec: AIRecommendation) -> tuple[str, int]:
    """Return the persisted analysis time and its current age."""
    generated_at = rec.payload.get("generatedAt")
    try:
        parsed = datetime.fromisoformat(generated_at) if isinstance(generated_at, str) else None
    except ValueError:
        parsed = None

    if parsed is None:
        parsed = rec.created_at
        generated_at = parsed.isoformat()
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    age_seconds = max(0, int((datetime.now(timezone.utc) - parsed).total_seconds()))
    return generated_at, age_seconds


def log_recommendation(db: Session, user: User, portfolio: Portfolio, rec: AIRecommendation) -> None:
    from app.services.trades import log_decision

    log_decision(
        db,
        portfolio_id=portfolio.id,
        user_id=user.id,
        event_type=DecisionEventType.AI_RECOMMENDATION,
        payload={
            "recommendation_id": rec.id,
            "action": rec.action,
            "symbol": rec.symbol,
            "confidence": round(rec.confidence * 100),
            "riskImpact": rec.risk_impact,
            "expectedReturnImpact": rec.expected_return_impact,
            "rationale": rec.rationale,
            "outcome": "AI analysis generated",
            "ai": rec.payload.get("ai", {}),
        },
    )


def build_dashboard_view(db: Session, portfolio: Portfolio, settings: UserSettings) -> dict:
    state = compute_portfolio_state(db, portfolio)
    risk = compute_risk_assessment(state, portfolio.target_allocations, settings.risk_profile)

    class_weights: dict[str, float] = {}
    for row in state["positions"]:
        ac = row["position"].asset_class.value
        class_weights[ac] = class_weights.get(ac, 0) + row["weight_percent"]

    allocations = [
        {
            "label": ASSET_CLASS_LABELS.get(AssetClass(k), k.title()),
            "percent": round(v, 1),
            "color": ALLOCATION_COLORS.get(AssetClass(k), "#8B95A8"),
        }
        for k, v in class_weights.items()
    ]
    cash_weight = round((state["cash_balance"] / state["total_value"]) * 100, 1) if state["total_value"] else 0
    if cash_weight > 0:
        allocations.append({"label": "Cash", "percent": cash_weight, "color": "#8B95A8"})
    evidence_cash_trend = cash_weight

    rec = (
        db.query(AIRecommendation)
        .filter(
            AIRecommendation.portfolio_id == portfolio.id,
            AIRecommendation.status == RecommendationStatus.ACTIVE,
        )
        .order_by(AIRecommendation.created_at.desc())
        .first()
    )
    analysis_timestamp, analysis_age_seconds = (
        analysis_details(rec) if rec else (None, None)
    )

    pending = (
        db.query(Trade)
        .filter(Trade.portfolio_id == portfolio.id, Trade.status == TradeStatus.PENDING)
        .count()
    )

    sparkline = portfolio_sparkline(state)
    day_change, day_change_percent = portfolio_day_change(state)

    return {
        "portfolio": {
            "totalValue": round(state["total_value"], 2),
            "dayChange": day_change,
            "dayChangePercent": day_change_percent,
            "riskScore": risk.score,
            "riskLabel": risk.label,
            "riskAlerts": [alert.model_dump() for alert in risk.alerts],
            "allocationDrift": risk.allocation_drift,
            "allocations": allocations,
            "sparkline": sparkline,
        },
        "recommendation": (
            {
                "id": rec.id,
                "action": rec.action.upper(),
                "symbol": rec.symbol or "",
                "confidence": round(rec.confidence * 100),
                "riskDelta": rec.risk_impact,
                "returnDelta": rec.expected_return_impact,
                "rationale": rec.rationale,
                "suggestedQuantity": rec.payload.get("suggestedQuantity"),
                "analysisTimestamp": analysis_timestamp,
                "analysisAgeSeconds": analysis_age_seconds,
                "alerts": rec.payload.get("alerts", []),
                "engine": (rec.payload.get("ai") or {}).get("provider", "rules"),
                "model": (rec.payload.get("ai") or {}).get("model"),
                "guardrailStatus": (rec.payload.get("ai") or {}).get("guardrailStatus"),
                "guardrailEvidence": {
                    "promptVersion": (rec.payload.get("ai") or {}).get("promptVersion"),
                    "fallbackReason": (rec.payload.get("ai") or {}).get("fallbackReason"),
                    "allowedActions": (rec.payload.get("ai") or {}).get("allowedActions"),
                    "allowedSymbols": (rec.payload.get("ai") or {}).get("allowedSymbols"),
                },
                "evidenceCashTrend": evidence_cash_trend,
                "guardrails": rec.payload.get("guardrails")
                or [
                    "Risk within range",
                    "Cash floor met",
                    "No concentration",
                ],
            }
            if rec
            else None
        ),
        "pendingTrades": pending,
    }


def build_portfolio_view(db: Session, portfolio: Portfolio, settings: UserSettings) -> dict:
    state = compute_portfolio_state(db, portfolio)
    risk = compute_risk_assessment(state, portfolio.target_allocations, settings.risk_profile)

    by_class: dict[AssetClass, list] = {}
    for row in state["positions"]:
        pos = row["position"]
        price = row["market_price"] or pos.avg_cost
        change = ((price - pos.avg_cost) / pos.avg_cost * 100) if pos.avg_cost else 0
        entry = {
            "symbol": pos.symbol,
            "name": market_data_service.get_name(pos.symbol),
            "assetClass": pos.asset_class.value.upper(),
            "shares": pos.quantity,
            "price": round(price, 2),
            "value": round(row["market_value"], 2),
            "changePercent": round(change, 2),
        }
        by_class.setdefault(pos.asset_class, []).append(entry)

    class_weights: dict[AssetClass, float] = {}
    for row in state["positions"]:
        ac = row["position"].asset_class
        class_weights[ac] = class_weights.get(ac, 0) + row["weight_percent"]

    asset_classes = []
    for ac in AssetClass:
        if ac == AssetClass.CASH:
            continue
        target = portfolio.target_allocations.get(ac.value, 0)
        current = class_weights.get(ac, 0)
        positions = by_class.get(ac, [])
        if target > 0 or positions:
            asset_classes.append(
                {
                    "assetClass": ac.value.upper(),
                    "currentPercent": round(current, 1),
                    "targetPercent": target,
                    "positions": positions,
                }
            )

    return {
        "riskScore": risk.score,
        "riskLabel": risk.label,
        "riskAlerts": [alert.model_dump() for alert in risk.alerts],
        "allocationDrift": risk.allocation_drift,
        "assetClasses": asset_classes,
    }


def build_trades_view(db: Session, portfolio: Portfolio) -> list:
    trades = (
        db.query(Trade)
        .filter(Trade.portfolio_id == portfolio.id)
        .order_by(Trade.created_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for t in trades:
        status_map = {
            TradeStatus.PENDING: "pending",
            TradeStatus.EXECUTED: "executed",
            TradeStatus.REJECTED: "dismissed",
            TradeStatus.CANCELLED: "dismissed",
        }
        result.append(
            {
                "id": t.id,
                "symbol": t.symbol,
                "side": t.side.value.upper(),
                "quantity": t.quantity,
                "price": t.executed_price or t.limit_price or 0,
                "mode": t.mode.value,
                "status": status_map.get(t.status, "pending"),
                "timestamp": t.created_at.isoformat(),
                "pnl": t.realized_pnl,
            }
        )
    return result


def build_insights_view(db: Session, portfolio: Portfolio) -> list:
    from app.models import DecisionLog

    logs = (
        db.query(DecisionLog)
        .filter(DecisionLog.portfolio_id == portfolio.id)
        .order_by(DecisionLog.created_at.desc())
        .limit(30)
        .all()
    )
    result = []
    for log in logs:
        payload = log.payload or {}
        result.append(
            {
                "id": log.id,
                "timestamp": log.created_at.isoformat(),
                "action": payload.get("action", log.event_type.value.split(".")[0].upper()),
                "symbol": payload.get("symbol"),
                "confidence": payload.get("confidence"),
                "riskDelta": payload.get("risk_impact"),
                "returnDelta": payload.get("expected_return_impact"),
                "rationale": payload.get("rationale", str(payload)),
                "outcome": payload.get("outcome", log.event_type.value),
            }
        )
    return result


def build_settings_view(settings: UserSettings) -> dict:
    return {
        "mode": "auto" if settings.auto_trade_enabled else "manual",
        "riskProfile": settings.risk_profile.value,
        "motionIntensity": "full",
        "soundEnabled": False,
    }


def update_settings(db: Session, settings: UserSettings, payload: dict) -> dict:
    from app.models import RiskProfile

    if "mode" in payload:
        settings.auto_trade_enabled = payload["mode"] == "auto"
    if "riskProfile" in payload:
        try:
            settings.risk_profile = RiskProfile(payload["riskProfile"])
        except ValueError:
            valid = [p.value for p in RiskProfile]
            raise HTTPException(
                status_code=422,
                detail=f"Invalid riskProfile. Must be one of: {valid}",
            )
    db.commit()
    return build_settings_view(settings)


def generate_recommendation(
    db: Session,
    user: User,
    portfolio: Portfolio,
    settings: UserSettings,
    *,
    symbol: str | None = None,
    quantity: float | None = None,
) -> dict:
    from app.services.ai import ai_service

    if symbol and quantity:
        raise HTTPException(
            status_code=400,
            detail="Manual symbol overrides are disabled. Use live AI generation.",
        )

    rec = ai_service.generate(db, portfolio, settings.risk_profile)
    log_recommendation(db, user, portfolio, rec)
    return {
        "success": True,
        "recommendationId": rec.id,
        "provider": (rec.payload.get("ai") or {}).get("provider", "rules"),
        "guardrailStatus": (rec.payload.get("ai") or {}).get("guardrailStatus"),
    }


def approve_trade(db: Session, user: User, portfolio: Portfolio, trade_id: str) -> dict:
    from app.services.trades import trade_service

    trade = db.get(Trade, trade_id)
    if not trade or trade.portfolio_id != portfolio.id:
        raise HTTPException(status_code=404, detail="Trade not found")
    try:
        trade_service.approve_trade(db, trade=trade, user=user)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return {"success": True, "status": trade.status.value}


def dismiss_recommendation(db: Session, portfolio: Portfolio) -> dict:
    rec = (
        db.query(AIRecommendation)
        .filter(
            AIRecommendation.portfolio_id == portfolio.id,
            AIRecommendation.status == RecommendationStatus.ACTIVE,
        )
        .first()
    )
    if rec:
        rec.status = RecommendationStatus.DISMISSED
        db.commit()
    return {"success": True}


def approve_recommendation(
    db: Session,
    user: User,
    portfolio: Portfolio,
    recommendation_id: str,
) -> dict:
    from app.services.trades import trade_service

    rec = db.get(AIRecommendation, recommendation_id)
    if not rec or rec.portfolio_id != portfolio.id:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    if rec.status != RecommendationStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Recommendation not active")
    if rec.action == "HOLD" or not rec.symbol:
        raise HTTPException(status_code=400, detail="No trade to execute")

    side = TradeSide.BUY if rec.action == "REBALANCE_BUY" else TradeSide.SELL
    quantity = rec.payload.get("suggestedQuantity")
    if not quantity:
        raise HTTPException(status_code=400, detail="No safe quantity available")
    try:
        trade = trade_service.create_trade(
            db,
            portfolio=portfolio,
            user=user,
            symbol=rec.symbol,
            side=side,
            quantity=quantity,
            recommendation_id=rec.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    rec.status = RecommendationStatus.APPROVED
    db.commit()
    return {"success": True, "tradeId": trade.id, "status": trade.status.value}
