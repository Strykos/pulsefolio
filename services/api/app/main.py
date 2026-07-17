import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import ai, auth, dashboard, me, portfolio, stream, trades
from app.routers import settings as settings_router
from app.schemas import HealthResponse
from app.services.websocket import hub

logger = logging.getLogger(__name__)
app_settings = get_settings()


async def _bootstrap_database() -> None:
    """Run migrations/seed off the critical path so /health can pass deploy checks."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.interval import IntervalTrigger

    from app.database import SessionLocal
    from app.seed import ensure_demo_auto_mode, seed_demo_data
    from app.services.ai import ai_service
    from app.services.auto_trader import process_auto_trades

    try:
        init_db()
    except Exception:
        logger.exception("Database initialization failed")
        return

    db = SessionLocal()
    try:
        user = seed_demo_data(db)
        ensure_demo_auto_mode(db)
        if user:
            from app.models import AIRecommendation, Portfolio, RecommendationStatus

            portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
            if portfolio:
                active = (
                    db.query(AIRecommendation)
                    .filter(
                        AIRecommendation.portfolio_id == portfolio.id,
                        AIRecommendation.status == RecommendationStatus.ACTIVE,
                    )
                    .first()
                )
                if not active:
                    ai_service.generate(db, portfolio)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Demo seed failed")
    finally:
        db.close()

    try:
        count = process_auto_trades()
        logger.info("Initial auto-trade cycle executed %d trade(s)", count)
    except Exception:
        logger.exception("Initial auto-trade cycle failed")

    scheduler = AsyncIOScheduler()
    scheduler.add_job(process_auto_trades, IntervalTrigger(minutes=10), id="auto_trades")
    scheduler.start()
    app.state.auto_trade_scheduler = scheduler
    logger.info("Auto-trader scheduler started (every 10 minutes)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await hub.start_heartbeat()
    bootstrap_task = asyncio.create_task(_bootstrap_database())
    yield
    scheduler = getattr(app.state, "auto_trade_scheduler", None)
    if scheduler:
        scheduler.shutdown(wait=False)
    bootstrap_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await bootstrap_task


app = FastAPI(
    title=app_settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url=f"{app_settings.api_v1_prefix}/docs",
    redoc_url=f"{app_settings.api_v1_prefix}/redoc",
    openapi_url=f"{app_settings.api_v1_prefix}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix=app_settings.api_v1_prefix)
api_router.include_router(auth.router)
api_router.include_router(portfolio.router)
api_router.include_router(trades.router)
api_router.include_router(ai.router)
api_router.include_router(settings_router.router)
api_router.include_router(stream.router)
api_router.include_router(dashboard.router)
api_router.include_router(me.router)


@api_router.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", version="0.1.0")


app.include_router(api_router)


@app.get("/", tags=["health"])
def root() -> dict:
    """Landing page for browser visits to http://localhost:8000"""
    prefix = app_settings.api_v1_prefix
    return {
        "service": app_settings.app_name,
        "status": "ok",
        "message": "API is running. Use the paths below — the root URL is not the dashboard.",
        "docs": f"{prefix}/docs",
        "health": f"{prefix}/health",
        "dashboard": f"{prefix}/public/dashboard",
        "portfolio": f"{prefix}/public/portfolio",
        "generateRecommendation": f"{prefix}/public/recommendations/generate",
    }


@app.get(app_settings.api_v1_prefix, tags=["health"])
def api_v1_root() -> dict:
    return root()
