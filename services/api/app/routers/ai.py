from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import AIRecommendation, DecisionEventType, Portfolio, RecommendationStatus, RiskProfile, TradeSide, User, UserSettings
from app.schemas import AIRecommendationRequest, AIRecommendationResponse, TradeResponse
from app.services.ai import ai_service
from app.services.trades import log_decision, trade_service
from app.services.websocket import hub

router = APIRouter(prefix="/ai", tags=["ai"])


def _get_owned_portfolio(db: Session, portfolio_id: str, user: User) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


def _get_owned_recommendation(db: Session, rec_id: str, user: User) -> AIRecommendation:
    rec = db.get(AIRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    _get_owned_portfolio(db, rec.portfolio_id, user)
    return rec


@router.get("/recommendations", response_model=list[AIRecommendationResponse])
def list_recommendations(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    portfolio_id: str | None = Query(default=None),
    status_filter: RecommendationStatus | None = Query(default=None, alias="status"),
) -> list[AIRecommendationResponse]:
    query = (
        db.query(AIRecommendation)
        .join(Portfolio)
        .filter(Portfolio.user_id == current_user.id)
    )
    if portfolio_id:
        query = query.filter(AIRecommendation.portfolio_id == portfolio_id)
    if status_filter:
        query = query.filter(AIRecommendation.status == status_filter)
    return query.order_by(AIRecommendation.created_at.desc()).all()


@router.post(
    "/recommendations",
    response_model=AIRecommendationResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_recommendation(
    payload: AIRecommendationRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AIRecommendationResponse:
    portfolio = _get_owned_portfolio(db, payload.portfolio_id, current_user)
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    rec = ai_service.generate(
        db,
        portfolio,
        settings.risk_profile if settings else RiskProfile.BALANCED,
    )
    log_decision(
        db,
        portfolio_id=portfolio.id,
        user_id=current_user.id,
        event_type=DecisionEventType.AI_RECOMMENDATION,
        payload={
            "recommendation_id": rec.id,
            "action": rec.action,
            "symbol": rec.symbol,
            "riskImpact": rec.risk_impact,
            "expectedReturnImpact": rec.expected_return_impact,
            "rationale": rec.rationale,
        },
    )
    hub.broadcast(
        portfolio.id,
        "ai.recommendation",
        {
            "recommendation_id": rec.id,
            "action": rec.action,
            "symbol": rec.symbol,
            "confidence": rec.confidence,
            "riskImpact": rec.risk_impact,
            "expectedReturnImpact": rec.expected_return_impact,
            "rationale": rec.rationale,
        },
    )
    return rec


@router.get("/recommendations/{recommendation_id}", response_model=AIRecommendationResponse)
def get_recommendation(
    recommendation_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AIRecommendationResponse:
    return _get_owned_recommendation(db, recommendation_id, current_user)


@router.post("/recommendations/{recommendation_id}/dismiss", response_model=AIRecommendationResponse)
def dismiss_recommendation(
    recommendation_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AIRecommendationResponse:
    rec = _get_owned_recommendation(db, recommendation_id, current_user)
    rec.status = RecommendationStatus.DISMISSED
    db.commit()
    db.refresh(rec)
    return rec


@router.post(
    "/recommendations/{recommendation_id}/approve",
    response_model=TradeResponse,
    status_code=status.HTTP_201_CREATED,
)
def approve_recommendation(
    recommendation_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeResponse:
    rec = _get_owned_recommendation(db, recommendation_id, current_user)
    if rec.status != RecommendationStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recommendation not active")
    if rec.action == "HOLD" or not rec.symbol:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No trade to execute")

    side = TradeSide.BUY if rec.action == "REBALANCE_BUY" else TradeSide.SELL
    qty = rec.payload.get("suggestedQuantity") or 1.0
    portfolio = _get_owned_portfolio(db, rec.portfolio_id, current_user)
    try:
        trade = trade_service.create_trade(
            db,
            portfolio=portfolio,
            user=current_user,
            symbol=rec.symbol,
            side=side,
            quantity=qty,
            recommendation_id=rec.id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    rec.status = RecommendationStatus.APPROVED
    db.commit()
    return trade
