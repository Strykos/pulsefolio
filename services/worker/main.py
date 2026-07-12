#!/usr/bin/env python3
"""Pulsefolio auto-trade worker — runs 24/7 in cloud."""

import asyncio
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "api"))

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal, init_db
from app.models import Portfolio, RecommendationStatus, TradeSide, UserSettings
from app.services.ai import ai_service
from app.services.trades import trade_service
from app.services.websocket import hub

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pulsefolio.worker")


async def process_auto_trades():
    db = SessionLocal()
    try:
        rows = (
            db.query(Portfolio, UserSettings)
            .join(UserSettings, UserSettings.user_id == Portfolio.user_id)
            .filter(UserSettings.auto_trade_enabled == True)  # noqa: E712
            .all()
        )
        logger.info("Processing %d auto-mode portfolios", len(rows))
        for portfolio, settings in rows:
            try:
                user = portfolio.user
                rec = ai_service.generate(db, portfolio, risk_profile=settings.risk_profile)
                if rec.action == "HOLD" or not rec.symbol:
                    continue
                side = TradeSide.SELL if "SELL" in rec.action else TradeSide.BUY
                qty = rec.payload.get("suggestedQuantity") or 1.0
                trade = trade_service.create_trade(
                    db,
                    portfolio=portfolio,
                    user=user,
                    symbol=rec.symbol,
                    side=side,
                    quantity=qty,
                    recommendation_id=rec.id,
                    auto=True,
                )
                rec.status = RecommendationStatus.EXECUTED
                db.commit()
                logger.info("Auto-executed %s %s for portfolio %s", side.value, rec.symbol, portfolio.id)
            except Exception as exc:
                logger.exception("Error portfolio %s: %s", portfolio.id, exc)
    finally:
        db.close()


async def heartbeat():
    await hub.broadcast("global", "worker.heartbeat", {
        "status": "live",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def main():
    init_db()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(process_auto_trades, IntervalTrigger(minutes=15), id="auto_trades")
    scheduler.add_job(process_auto_trades, CronTrigger(hour=11, minute=0), id="daily_rebalance")
    scheduler.add_job(heartbeat, IntervalTrigger(seconds=60), id="heartbeat")
    scheduler.start()
    logger.info("Pulsefolio worker started")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
