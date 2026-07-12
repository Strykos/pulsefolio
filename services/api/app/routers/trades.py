from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Portfolio, Trade, TradeStatus, User
from app.schemas import TradeCreate, TradeResponse
from app.services.trades import trade_service

router = APIRouter(prefix="/trades", tags=["trades"])


def _get_owned_portfolio(db: Session, portfolio_id: str, user: User) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


def _get_owned_trade(db: Session, trade_id: str, user: User) -> Trade:
    trade = db.get(Trade, trade_id)
    if not trade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trade not found")
    _get_owned_portfolio(db, trade.portfolio_id, user)
    return trade


@router.get("", response_model=list[TradeResponse])
def list_trades(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    portfolio_id: str | None = Query(default=None),
    status_filter: TradeStatus | None = Query(default=None, alias="status"),
) -> list[TradeResponse]:
    query = db.query(Trade).join(Portfolio).filter(Portfolio.user_id == current_user.id)
    if portfolio_id:
        query = query.filter(Trade.portfolio_id == portfolio_id)
    if status_filter:
        query = query.filter(Trade.status == status_filter)
    return query.order_by(Trade.created_at.desc()).all()


@router.post("", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
def create_trade(
    payload: TradeCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeResponse:
    portfolio = _get_owned_portfolio(db, payload.portfolio_id, current_user)
    try:
        trade = trade_service.create_trade(
            db,
            portfolio=portfolio,
            user=current_user,
            symbol=payload.symbol,
            side=payload.side,
            quantity=payload.quantity,
            limit_price=payload.limit_price,
            recommendation_id=payload.recommendation_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return trade


@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(
    trade_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeResponse:
    return _get_owned_trade(db, trade_id, current_user)


@router.post("/{trade_id}/approve", response_model=TradeResponse)
def approve_trade(
    trade_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeResponse:
    trade = _get_owned_trade(db, trade_id, current_user)
    try:
        return trade_service.approve_trade(db, trade=trade, user=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{trade_id}/reject", response_model=TradeResponse)
def reject_trade(
    trade_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeResponse:
    trade = _get_owned_trade(db, trade_id, current_user)
    try:
        return trade_service.reject_trade(db, trade=trade, user=current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
