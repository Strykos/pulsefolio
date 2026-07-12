from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import DecisionEventType, Portfolio, RiskProfile, User, UserSettings
from app.schemas import (
    PortfolioCreate,
    PortfolioListItem,
    PortfolioResponse,
    PortfolioSummary,
    PortfolioUpdate,
    PositionResponse,
    RiskAssessment,
)
from app.services.risk import compute_risk_assessment
from app.services.simulation import compute_portfolio_state, seed_initial_cash
from app.services.trades import log_decision

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


def _targets_to_dict(targets) -> dict[str, float]:
    return {t.asset_class.value: t.target_percent for t in targets}


def _build_summary(db: Session, portfolio: Portfolio, user: User) -> PortfolioSummary:
    state = compute_portfolio_state(db, portfolio)
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    risk = compute_risk_assessment(
        state,
        portfolio.target_allocations,
        settings.risk_profile if settings else RiskProfile.BALANCED,
    )
    return PortfolioSummary(
        total_value=round(state["total_value"], 2),
        cash_balance=round(state["cash_balance"], 2),
        invested_value=round(state["invested_value"], 2),
        unrealized_pnl=round(state["unrealized_pnl"], 2),
        unrealized_pnl_percent=round(state["unrealized_pnl_percent"], 2),
        risk_score=risk.score,
        risk_label=risk.label,
    )


def _build_positions(state: dict) -> list[PositionResponse]:
    rows = []
    for row in state["positions"]:
        pos = row["position"]
        rows.append(
            PositionResponse(
                id=pos.id,
                symbol=pos.symbol,
                asset_class=pos.asset_class,
                quantity=pos.quantity,
                avg_cost=pos.avg_cost,
                market_price=row["market_price"],
                market_value=round(row["market_value"], 2),
                unrealized_pnl=round(row["unrealized_pnl"], 2),
                weight_percent=round(row["weight_percent"], 2),
            )
        )
    return rows


def _get_owned_portfolio(
    db: Session, portfolio_id: str, user: User
) -> Portfolio:
    portfolio = db.get(Portfolio, portfolio_id)
    if not portfolio or portfolio.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return portfolio


@router.get("", response_model=list[PortfolioListItem])
def list_portfolios(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[PortfolioListItem]:
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return [
        PortfolioListItem(
            id=p.id,
            name=p.name,
            created_at=p.created_at,
            updated_at=p.updated_at,
            summary=_build_summary(db, p, current_user),
        )
        for p in portfolios
    ]


@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    payload: PortfolioCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PortfolioResponse:
    targets = _targets_to_dict(payload.target_allocations) if payload.target_allocations else {
        "stock": 30.0,
        "etf": 25.0,
        "bond": 20.0,
        "crypto": 10.0,
        "commodity": 5.0,
        "cash": 10.0,
    }
    portfolio = Portfolio(
        user_id=current_user.id,
        name=payload.name,
        target_allocations=targets,
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    seed_initial_cash(db, portfolio)
    log_decision(
        db,
        portfolio_id=portfolio.id,
        user_id=current_user.id,
        event_type=DecisionEventType.PORTFOLIO_UPDATED,
        payload={"action": "created", "name": portfolio.name, "targets": targets},
    )
    state = compute_portfolio_state(db, portfolio)
    return PortfolioResponse(
        id=portfolio.id,
        name=portfolio.name,
        target_allocations=portfolio.target_allocations,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
        summary=_build_summary(db, portfolio, current_user),
        positions=_build_positions(state),
    )


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PortfolioResponse:
    portfolio = _get_owned_portfolio(db, portfolio_id, current_user)
    state = compute_portfolio_state(db, portfolio)
    return PortfolioResponse(
        id=portfolio.id,
        name=portfolio.name,
        target_allocations=portfolio.target_allocations,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
        summary=_build_summary(db, portfolio, current_user),
        positions=_build_positions(state),
    )


@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio(
    portfolio_id: str,
    payload: PortfolioUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> PortfolioResponse:
    portfolio = _get_owned_portfolio(db, portfolio_id, current_user)
    if payload.name is not None:
        portfolio.name = payload.name
    if payload.target_allocations is not None:
        portfolio.target_allocations = _targets_to_dict(payload.target_allocations)
    db.commit()
    db.refresh(portfolio)
    log_decision(
        db,
        portfolio_id=portfolio.id,
        user_id=current_user.id,
        event_type=DecisionEventType.PORTFOLIO_UPDATED,
        payload={"action": "updated", "name": portfolio.name, "targets": portfolio.target_allocations},
    )
    state = compute_portfolio_state(db, portfolio)
    return PortfolioResponse(
        id=portfolio.id,
        name=portfolio.name,
        target_allocations=portfolio.target_allocations,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at,
        summary=_build_summary(db, portfolio, current_user),
        positions=_build_positions(state),
    )


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(
    portfolio_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    portfolio = _get_owned_portfolio(db, portfolio_id, current_user)
    db.delete(portfolio)
    db.commit()


@router.get("/{portfolio_id}/risk", response_model=RiskAssessment)
def get_portfolio_risk(
    portfolio_id: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RiskAssessment:
    portfolio = _get_owned_portfolio(db, portfolio_id, current_user)
    state = compute_portfolio_state(db, portfolio)
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    return compute_risk_assessment(
        state,
        portfolio.target_allocations,
        settings.risk_profile if settings else RiskProfile.BALANCED,
    )
