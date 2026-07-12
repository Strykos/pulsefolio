"""Seed demo user and portfolio for local development."""

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import (
    AssetClass,
    Portfolio,
    Position,
    Trade,
    TradeMode,
    TradeSide,
    TradeStatus,
    User,
    UserSettings,
    RiskProfile,
)
from app.services.simulation import seed_initial_cash

DEMO_EMAIL = "demo@pulsefolio.app"
DEMO_PASSWORD = "demo12345"


def seed_demo_data(db: Session) -> User | None:
    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        return existing

    user = User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD))
    db.add(user)
    db.flush()

    settings = UserSettings(user_id=user.id, auto_trade_enabled=False, risk_profile=RiskProfile.BALANCED)
    db.add(settings)

    portfolio = Portfolio(
        user_id=user.id,
        name="Paper Portfolio",
        target_allocations={
            AssetClass.STOCK.value: 30.0,
            AssetClass.ETF.value: 25.0,
            AssetClass.BOND.value: 18.0,
            AssetClass.CRYPTO.value: 10.0,
            AssetClass.COMMODITY.value: 7.0,
            AssetClass.CASH.value: 10.0,
        },
    )
    db.add(portfolio)
    db.flush()
    seed_initial_cash(db, portfolio)

    positions = [
        ("AAPL", AssetClass.STOCK, 50, 168.0),
        ("MSFT", AssetClass.STOCK, 30, 380.0),
        ("VTI", AssetClass.ETF, 40, 245.0),
        ("BND", AssetClass.BOND, 80, 72.0),
        ("BTC", AssetClass.CRYPTO, 0.25, 62000.0),
        ("GLD", AssetClass.COMMODITY, 15, 220.0),
    ]
    for symbol, asset_class, qty, cost in positions:
        db.add(
            Position(
                portfolio_id=portfolio.id,
                symbol=symbol,
                asset_class=asset_class,
                quantity=qty,
                avg_cost=cost,
            )
        )

    db.commit()
    db.refresh(user)
    return user


def ensure_demo_pending_trade(db: Session) -> Trade | None:
    """Ensure the demo portfolio has one pending paper trade for Activity UI demos."""
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not user:
        return None

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
    if not portfolio:
        return None

    existing = (
        db.query(Trade)
        .filter(Trade.portfolio_id == portfolio.id, Trade.status == TradeStatus.PENDING)
        .first()
    )
    if existing:
        return existing

    trade = Trade(
        portfolio_id=portfolio.id,
        symbol="VTI",
        asset_class=AssetClass.ETF,
        side=TradeSide.BUY,
        quantity=10,
        limit_price=245.0,
        status=TradeStatus.PENDING,
        mode=TradeMode.MANUAL,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade
