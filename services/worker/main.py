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
from app.services.auto_trader import process_auto_trades
from app.services.websocket import hub

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pulsefolio.worker")


async def process_auto_trades_job():
    count = process_auto_trades()
    logger.info("Auto-trade job finished (%d executed)", count)


async def heartbeat():
    await hub.broadcast("global", "worker.heartbeat", {
        "status": "live",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def main():
    init_db()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(process_auto_trades_job, IntervalTrigger(minutes=15), id="auto_trades")
    scheduler.add_job(process_auto_trades_job, CronTrigger(hour=11, minute=0), id="daily_rebalance")
    scheduler.add_job(heartbeat, IntervalTrigger(seconds=60), id="heartbeat")
    scheduler.start()
    logger.info("Pulsefolio worker started")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
