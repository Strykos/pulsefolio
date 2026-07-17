"""Background auto-trading for portfolios in auto mode."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    AIRecommendation,
    Portfolio,
    RecommendationStatus,
    Trade,
    TradeMode,
    TradeSide,
    TradeStatus,
    UserSettings,
)
from app.services.ai import ai_service
from app.services.trades import trade_service

logger = logging.getLogger(__name__)

# Re-evaluate recommendations at least this often so stale BUY/SELL plans
# cannot keep retrying after the portfolio state has changed.
MAX_RECOMMENDATION_AGE_SECONDS = 15 * 60


def _cancel_stuck_auto_trades(db: Session, portfolio: Portfolio) -> int:
    """Cancel pending auto trades that never filled (usually failed cash checks)."""
    stuck = (
        db.query(Trade)
        .filter(
            Trade.portfolio_id == portfolio.id,
            Trade.status == TradeStatus.PENDING,
            Trade.mode == TradeMode.AUTO,
        )
        .all()
    )
    for trade in stuck:
        trade.status = TradeStatus.CANCELLED
    if stuck:
        db.commit()
        logger.info(
            "Cancelled %d stuck pending auto trade(s) for portfolio %s",
            len(stuck),
            portfolio.id,
        )
    return len(stuck)


def _recommendation_age_seconds(rec: AIRecommendation) -> int:
    from datetime import datetime, timezone

    generated_at = rec.payload.get("generatedAt") if isinstance(rec.payload, dict) else None
    try:
        parsed = datetime.fromisoformat(generated_at) if isinstance(generated_at, str) else None
    except ValueError:
        parsed = None
    if parsed is None:
        parsed = rec.created_at
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return max(0, int((datetime.now(timezone.utc) - parsed).total_seconds()))


def _dismiss_stale_recommendation(
    db: Session,
    portfolio: Portfolio,
    rec: AIRecommendation | None,
) -> None:
    if not rec:
        return
    age_seconds = _recommendation_age_seconds(rec)
    if age_seconds >= MAX_RECOMMENDATION_AGE_SECONDS:
        rec.status = RecommendationStatus.DISMISSED
        db.commit()
        logger.info(
            "Dismissed stale recommendation %s (age=%ss) for portfolio %s",
            rec.id,
            age_seconds,
            portfolio.id,
        )


def _execute_recommendation(db: Session, portfolio: Portfolio, rec: AIRecommendation) -> bool:
    if rec.action == "HOLD" or not rec.symbol:
        rec.status = RecommendationStatus.DISMISSED
        db.commit()
        return False

    side = TradeSide.SELL if "SELL" in rec.action else TradeSide.BUY
    quantity = rec.payload.get("suggestedQuantity") or 1.0
    try:
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
    except Exception:
        # Leave the trade cancelled (handled in create_trade) and force a fresh
        # recommendation next cycle instead of endlessly retrying the same plan.
        rec.status = RecommendationStatus.DISMISSED
        db.commit()
        logger.exception(
            "Auto-trade failed for %s %s qty=%s portfolio=%s — recommendation dismissed",
            side.value,
            rec.symbol,
            quantity,
            portfolio.id,
        )
        return False

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


def process_auto_trades(db: Session | None = None) -> int:
    """Evaluate and execute trades for all auto-mode portfolios. Returns execution count."""
    owns_session = db is None
    if owns_session:
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
                _cancel_stuck_auto_trades(db, portfolio)

                active = (
                    db.query(AIRecommendation)
                    .filter(
                        AIRecommendation.portfolio_id == portfolio.id,
                        AIRecommendation.status == RecommendationStatus.ACTIVE,
                    )
                    .order_by(AIRecommendation.created_at.desc())
                    .first()
                )
                _dismiss_stale_recommendation(db, portfolio, active)
                db.refresh(portfolio)

                active = (
                    db.query(AIRecommendation)
                    .filter(
                        AIRecommendation.portfolio_id == portfolio.id,
                        AIRecommendation.status == RecommendationStatus.ACTIVE,
                    )
                    .order_by(AIRecommendation.created_at.desc())
                    .first()
                )
                if not active:
                    active = ai_service.generate(
                        db, portfolio, risk_profile=settings.risk_profile
                    )

                if _execute_recommendation(db, portfolio, active):
                    executed += 1
            except Exception:
                db.rollback()
                logger.exception("Auto-trade failed for portfolio %s", portfolio.id)
    finally:
        if owns_session:
            db.close()
    return executed
