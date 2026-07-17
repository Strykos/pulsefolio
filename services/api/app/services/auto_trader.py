"""Background auto-trading for portfolios in auto mode."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    AIRecommendation,
    Portfolio,
    RecommendationStatus,
    TradeSide,
    UserSettings,
)
from app.services.ai import ai_service
from app.services.trades import trade_service

logger = logging.getLogger(__name__)


def _execute_recommendation(db: Session, portfolio: Portfolio, rec: AIRecommendation) -> bool:
    if rec.action == "HOLD" or not rec.symbol:
        rec.status = RecommendationStatus.DISMISSED
        db.commit()
        return False

    side = TradeSide.SELL if "SELL" in rec.action else TradeSide.BUY
    quantity = rec.payload.get("suggestedQuantity") or 1.0
    trade_service.create_trade(
        db,
        portfolio=portfolio,
        user=portfolio.user,
        symbol=rec.symbol,
        side=side,
        quantity=quantity,
        recommendation_id=rec.id,
        auto=True,
    )
    rec.status = RecommendationStatus.EXECUTED
    db.commit()
    logger.info(
        "Auto-executed %s %s qty=%s portfolio=%s",
        side.value,
        rec.symbol,
        quantity,
        portfolio.id,
    )
    return True


def process_auto_trades() -> int:
    """Evaluate and execute trades for all auto-mode portfolios. Returns execution count."""
    db = SessionLocal()
    executed = 0
    try:
        rows = (
            db.query(Portfolio, UserSettings)
            .join(UserSettings, UserSettings.user_id == Portfolio.user_id)
            .filter(UserSettings.auto_trade_enabled.is_(True))
            .all()
        )
        logger.info("Auto-trader cycle: %d portfolio(s) in auto mode", len(rows))
        for portfolio, settings in rows:
            try:
                active = (
                    db.query(AIRecommendation)
                    .filter(
                        AIRecommendation.portfolio_id == portfolio.id,
                        AIRecommendation.status == RecommendationStatus.ACTIVE,
                    )
                    .order_by(AIRecommendation.created_at.desc())
                    .first()
                )
                if active:
                    if _execute_recommendation(db, portfolio, active):
                        executed += 1
                    continue

                rec = ai_service.generate(db, portfolio, risk_profile=settings.risk_profile)
                if _execute_recommendation(db, portfolio, rec):
                    executed += 1
            except Exception:
                db.rollback()
                logger.exception("Auto-trade failed for portfolio %s", portfolio.id)
    finally:
        db.close()
    return executed
