"""Tests for profit-aware auto trading and rebalance priority."""

from datetime import datetime, timedelta, timezone

from app.models import (
    AIRecommendation,
    AssetClass,
    Portfolio,
    Position,
    RecommendationStatus,
    Trade,
    TradeMode,
    TradeSide,
    TradeStatus,
    User,
    UserSettings,
    RiskProfile,
)
from app.services.ai import ai_service
from app.services.auto_trader import process_auto_trades
from app.services.simulation import seed_initial_cash


def _build_concentrated_portfolio(db_session) -> Portfolio:
    user = User(email="profit@example.com", hashed_password="x")
    db_session.add(user)
    db_session.flush()
    db_session.add(
        UserSettings(
            user_id=user.id,
            auto_trade_enabled=True,
            risk_profile=RiskProfile.BALANCED,
        )
    )
    portfolio = Portfolio(
        user_id=user.id,
        name="Concentrated",
        target_allocations={
            "stock": 30.0,
            "etf": 25.0,
            "bond": 18.0,
            "crypto": 10.0,
            "commodity": 7.0,
            "cash": 10.0,
        },
    )
    db_session.add(portfolio)
    db_session.flush()
    seed_initial_cash(db_session, portfolio)
    # Spend most cash into a concentrated AAPL book so cash floor + concentration fire.
    db_session.add(
        Position(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            asset_class=AssetClass.STOCK,
            quantity=500,
            avg_cost=168.0,
        )
    )
    # Leave a small cash balance by recording an offsetting buy.
    from app.services.simulation import record_cash_movement

    record_cash_movement(
        db_session,
        portfolio.id,
        -95_000,
        "Simulate heavy AAPL deployment",
    )
    db_session.commit()
    db_session.refresh(portfolio)
    return portfolio


def test_ai_prioritizes_concentration_sell(db_session, monkeypatch):
    monkeypatch.setattr(ai_service, "provider", None)
    portfolio = _build_concentrated_portfolio(db_session)

    rec = ai_service.generate(db_session, portfolio)

    assert rec.action == "REBALANCE_SELL"
    assert rec.symbol == "AAPL"
    assert rec.payload["priorityReason"] == "concentration"
    assert rec.payload["suggestedQuantity"] > 0
    assert rec.payload["ai"]["promptVersion"] == "portfolio-decision-v2"


def test_auto_trader_cancels_stuck_pending_and_sells(db_session, monkeypatch):
    monkeypatch.setattr(ai_service, "provider", None)
    portfolio = _build_concentrated_portfolio(db_session)

    # Stale unaffordable BUY left by the previous buggy cycle.
    stale_rec = AIRecommendation(
        portfolio_id=portfolio.id,
        action="REBALANCE_BUY",
        symbol="VTI",
        confidence=0.9,
        risk_impact=0.1,
        expected_return_impact=0.1,
        rationale="stale buy",
        payload={
            "suggestedQuantity": 28.87,
            "generatedAt": (datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
        },
        status=RecommendationStatus.ACTIVE,
    )
    stuck = Trade(
        portfolio_id=portfolio.id,
        symbol="VTI",
        asset_class=AssetClass.ETF,
        side=TradeSide.BUY,
        quantity=28.87,
        status=TradeStatus.PENDING,
        mode=TradeMode.AUTO,
    )
    db_session.add_all([stale_rec, stuck])
    db_session.commit()

    executed = process_auto_trades(db_session)
    assert executed >= 1

    db_session.refresh(stuck)
    assert stuck.status == TradeStatus.CANCELLED

    db_session.refresh(stale_rec)
    assert stale_rec.status == RecommendationStatus.DISMISSED

    sells = (
        db_session.query(Trade)
        .filter(
            Trade.portfolio_id == portfolio.id,
            Trade.side == TradeSide.SELL,
            Trade.status == TradeStatus.EXECUTED,
        )
        .all()
    )
    assert sells
    assert sells[0].symbol == "AAPL"
