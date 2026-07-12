"""JWT-protected endpoints mirroring /public/* for authenticated users."""

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Portfolio, User, UserSettings
from app.routers.dashboard import GenerateRecommendationRequest
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
from app.services.rate_limit import check_generate_rate_limit

router = APIRouter(prefix="/me", tags=["me"])


def _get_user_context(db: Session, user: User) -> tuple[Portfolio, UserSettings]:
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return portfolio, settings


@router.get("/dashboard")
def get_dashboard(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, settings = _get_user_context(db, current_user)
    return build_dashboard_view(db, portfolio, settings)


@router.get("/portfolio")
def get_portfolio_view(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, settings = _get_user_context(db, current_user)
    return build_portfolio_view(db, portfolio, settings)


@router.get("/trades")
def get_trades_view(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, _ = _get_user_context(db, current_user)
    return build_trades_view(db, portfolio)


@router.get("/insights")
def get_insights_view(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, _ = _get_user_context(db, current_user)
    return build_insights_view(db, portfolio)


@router.get("/settings")
def get_settings_view(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _, settings = _get_user_context(db, current_user)
    return build_settings_view(settings)


@router.patch("/settings")
def update_settings_view(
    payload: dict,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    _, settings = _get_user_context(db, current_user)
    return update_settings(db, settings, payload)


@router.post("/recommendations/generate")
def generate_recommendation_me(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    body: GenerateRecommendationRequest | None = Body(default=None),
):
    check_generate_rate_limit(f"user:{current_user.id}")
    portfolio, settings = _get_user_context(db, current_user)
    return generate_recommendation(
        db,
        current_user,
        portfolio,
        settings,
        symbol=body.symbol if body else None,
        quantity=body.quantity if body else None,
    )


@router.post("/trades/{trade_id}/approve")
def approve_trade_me(
    trade_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, _ = _get_user_context(db, current_user)
    return approve_trade(db, current_user, portfolio, trade_id)


@router.post("/recommendations/dismiss")
def dismiss_recommendation_me(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, _ = _get_user_context(db, current_user)
    return dismiss_recommendation(db, portfolio)


@router.post("/recommendations/{recommendation_id}/approve")
def approve_recommendation_me(
    recommendation_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    portfolio, _ = _get_user_context(db, current_user)
    return approve_recommendation(db, current_user, portfolio, recommendation_id)
