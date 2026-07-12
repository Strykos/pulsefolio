"""Aggregated dashboard endpoints for web/iOS clients."""

from typing import Annotated

from fastapi import APIRouter, Body, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Portfolio, User, UserSettings
from app.seed import seed_demo_data
from app.services.dashboard_views import (
    approve_recommendation,
    approve_trade,
    build_dashboard_view,
    build_insights_view,
    build_portfolio_view,
    build_settings_view,
    build_trades_view,
    dismiss_recommendation,
    generate_recommendation,
    update_settings,
)
from app.services.rate_limit import check_generate_rate_limit, rate_limit_key_for_request

router = APIRouter(prefix="/public", tags=["public-demo"])


class GenerateRecommendationRequest(BaseModel):
    symbol: str | None = None
    quantity: float | None = None


def _get_demo_context(db: Session) -> tuple[User, Portfolio, UserSettings]:
    from fastapi import HTTPException

    user = seed_demo_data(db)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to seed demo data")
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not portfolio or not settings:
        raise HTTPException(status_code=500, detail="Demo portfolio missing")
    return user, portfolio, settings


@router.get("/dashboard")
def get_dashboard(db: Annotated[Session, Depends(get_db)]):
    _, portfolio, settings = _get_demo_context(db)
    return build_dashboard_view(db, portfolio, settings)


@router.get("/portfolio")
def get_portfolio_view(db: Annotated[Session, Depends(get_db)]):
    _, portfolio, settings = _get_demo_context(db)
    return build_portfolio_view(db, portfolio, settings)


@router.get("/trades")
def get_trades_view(db: Annotated[Session, Depends(get_db)]):
    _, portfolio, _ = _get_demo_context(db)
    return build_trades_view(db, portfolio)


@router.get("/insights")
def get_insights_view(db: Annotated[Session, Depends(get_db)]):
    _, portfolio, _ = _get_demo_context(db)
    return build_insights_view(db, portfolio)


@router.get("/settings")
def get_settings_view(db: Annotated[Session, Depends(get_db)]):
    _, _, settings = _get_demo_context(db)
    return build_settings_view(settings)


@router.patch("/settings")
def update_settings_view(payload: dict, db: Annotated[Session, Depends(get_db)]):
    _, _, settings = _get_demo_context(db)
    return update_settings(db, settings, payload)


@router.post("/recommendations/generate")
def generate_recommendation_demo(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    body: GenerateRecommendationRequest | None = Body(default=None),
):
    check_generate_rate_limit(rate_limit_key_for_request(request))
    user, portfolio, settings = _get_demo_context(db)
    return generate_recommendation(
        db,
        user,
        portfolio,
        settings,
        symbol=body.symbol if body else None,
        quantity=body.quantity if body else None,
    )


@router.post("/trades/{trade_id}/approve")
def approve_trade_demo(trade_id: str, db: Annotated[Session, Depends(get_db)]):
    user, portfolio, _ = _get_demo_context(db)
    return approve_trade(db, user, portfolio, trade_id)


@router.post("/recommendations/dismiss")
def dismiss_recommendation_demo(db: Annotated[Session, Depends(get_db)]):
    _, portfolio, _ = _get_demo_context(db)
    return dismiss_recommendation(db, portfolio)


@router.post("/recommendations/{recommendation_id}/approve")
def approve_recommendation_demo(
    recommendation_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    user, portfolio, _ = _get_demo_context(db)
    return approve_recommendation(db, user, portfolio, recommendation_id)
