from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AssetClass, CashLedgerEntry, Portfolio, Position
from app.services.market_data import market_data

settings = get_settings()


def get_cash_balance(db: Session, portfolio_id: str) -> float:
    entry = (
        db.query(CashLedgerEntry)
        .filter(CashLedgerEntry.portfolio_id == portfolio_id)
        .order_by(CashLedgerEntry.created_at.desc())
        .first()
    )
    return entry.balance_after if entry else 0.0


def seed_initial_cash(db: Session, portfolio: Portfolio) -> CashLedgerEntry:
    entry = CashLedgerEntry(
        portfolio_id=portfolio.id,
        amount=settings.initial_cash,
        balance_after=settings.initial_cash,
        description="Initial paper trading deposit",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_position(db: Session, portfolio_id: str, symbol: str) -> Position | None:
    return (
        db.query(Position)
        .filter(Position.portfolio_id == portfolio_id, Position.symbol == symbol.upper())
        .first()
    )


def get_positions(db: Session, portfolio_id: str) -> list[Position]:
    return db.query(Position).filter(Position.portfolio_id == portfolio_id).all()


def compute_portfolio_state(db: Session, portfolio: Portfolio) -> dict:
    cash = get_cash_balance(db, portfolio.id)
    positions = get_positions(db, portfolio.id)
    invested = 0.0
    cost_basis = 0.0
    position_rows = []

    for pos in positions:
        if pos.quantity <= 0:
            continue
        try:
            price = market_data.get_price(pos.symbol)
        except ValueError:
            price = pos.avg_cost
        market_value = pos.quantity * price
        cost = pos.quantity * pos.avg_cost
        invested += market_value
        cost_basis += cost
        position_rows.append(
            {
                "position": pos,
                "market_price": price,
                "market_value": market_value,
                "unrealized_pnl": market_value - cost,
            }
        )

    total_value = cash + invested
    unrealized_pnl = invested - cost_basis if cost_basis else 0.0
    unrealized_pnl_percent = (unrealized_pnl / cost_basis * 100) if cost_basis else 0.0

    for row in position_rows:
        row["weight_percent"] = (
            (row["market_value"] / total_value * 100) if total_value > 0 else 0.0
        )

    return {
        "cash_balance": cash,
        "invested_value": invested,
        "total_value": total_value,
        "unrealized_pnl": unrealized_pnl,
        "unrealized_pnl_percent": unrealized_pnl_percent,
        "positions": position_rows,
    }


def record_cash_movement(
    db: Session,
    portfolio_id: str,
    amount: float,
    description: str,
    reference_id: str | None = None,
) -> CashLedgerEntry:
    balance = get_cash_balance(db, portfolio_id)
    new_balance = balance + amount
    if new_balance < -0.01:
        raise ValueError("Insufficient cash")
    entry = CashLedgerEntry(
        portfolio_id=portfolio_id,
        amount=amount,
        balance_after=round(new_balance, 4),
        description=description,
        reference_id=reference_id,
    )
    db.add(entry)
    return entry


def apply_trade_to_ledger(
    db: Session,
    portfolio_id: str,
    symbol: str,
    side: str,
    quantity: float,
    price: float,
    trade_id: str,
) -> tuple[Position, float | None]:
    symbol = symbol.upper()
    asset_class = market_data.get_asset_class(symbol)
    notional = quantity * price
    realized_pnl: float | None = None

    if side == "buy":
        record_cash_movement(db, portfolio_id, -notional, f"Buy {quantity} {symbol}", trade_id)
        position = get_position(db, portfolio_id, symbol)
        if position:
            total_cost = position.avg_cost * position.quantity + notional
            position.quantity += quantity
            position.avg_cost = total_cost / position.quantity if position.quantity else 0.0
        else:
            position = Position(
                portfolio_id=portfolio_id,
                symbol=symbol,
                asset_class=asset_class,
                quantity=quantity,
                avg_cost=price,
            )
            db.add(position)
    else:
        position = get_position(db, portfolio_id, symbol)
        if not position or position.quantity < quantity:
            raise ValueError("Insufficient position quantity")
        realized_pnl = (price - position.avg_cost) * quantity
        record_cash_movement(
            db,
            portfolio_id,
            notional,
            f"Sell {quantity} {symbol}",
            trade_id,
        )
        position.quantity -= quantity
        if position.quantity <= 1e-9:
            position.quantity = 0.0

    db.flush()
    return position, realized_pnl


def allocations_from_targets(target_allocations: dict) -> dict[str, float]:
    return {k: float(v) for k, v in target_allocations.items()}
