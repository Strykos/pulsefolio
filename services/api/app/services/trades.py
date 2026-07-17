from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    DecisionEventType,
    DecisionLog,
    Portfolio,
    RiskProfile,
    Trade,
    TradeMode,
    TradeSide,
    TradeStatus,
    User,
    UserSettings,
)
from app.services.market_data import market_data
from app.services.risk import compute_risk_assessment
from app.services.simulation import apply_trade_to_ledger, compute_portfolio_state
from app.services.websocket import hub


def log_decision(
    db: Session,
    *,
    portfolio_id: str,
    user_id: str,
    event_type: DecisionEventType,
    payload: dict,
) -> DecisionLog:
    entry = DecisionLog(
        portfolio_id=portfolio_id,
        user_id=user_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def _resolve_execution_price(trade: Trade) -> float:
    market_price = market_data.get_price(trade.symbol)
    if trade.limit_price is not None:
        if trade.side == TradeSide.BUY and market_price > trade.limit_price:
            raise ValueError("Market price above buy limit")
        if trade.side == TradeSide.SELL and market_price < trade.limit_price:
            raise ValueError("Market price below sell limit")
    return market_price


class TradeExecutionService:
    def create_trade(
        self,
        db: Session,
        *,
        portfolio: Portfolio,
        user: User,
        symbol: str,
        side: TradeSide,
        quantity: float,
        limit_price: float | None = None,
        recommendation_id: str | None = None,
        auto: bool = False,
    ) -> Trade:
        settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
        mode = TradeMode.AUTO if auto or (settings and settings.auto_trade_enabled) else TradeMode.MANUAL

        trade = Trade(
            portfolio_id=portfolio.id,
            symbol=symbol.upper(),
            asset_class=market_data.get_asset_class(symbol),
            side=side,
            quantity=quantity,
            limit_price=limit_price,
            status=TradeStatus.PENDING,
            mode=mode,
            recommendation_id=recommendation_id,
        )
        db.add(trade)
        db.commit()
        db.refresh(trade)

        log_decision(
            db,
            portfolio_id=portfolio.id,
            user_id=user.id,
            event_type=DecisionEventType.TRADE_CREATED,
            payload={
                "trade_id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side.value,
                "quantity": trade.quantity,
                "mode": trade.mode.value,
            },
        )

        if mode == TradeMode.AUTO:
            try:
                return self.execute_trade(db, trade=trade, user=user)
            except Exception:
                # create_trade already committed PENDING; do not leave orphans that
                # block capital and spam the activity feed on every auto cycle.
                trade.status = TradeStatus.CANCELLED
                db.commit()
                db.refresh(trade)
                log_decision(
                    db,
                    portfolio_id=portfolio.id,
                    user_id=user.id,
                    event_type=DecisionEventType.TRADE_REJECTED,
                    payload={
                        "trade_id": trade.id,
                        "reason": "auto_execution_failed",
                        "symbol": trade.symbol,
                        "side": trade.side.value,
                        "quantity": trade.quantity,
                    },
                )
                raise

        return trade

    def approve_trade(self, db: Session, *, trade: Trade, user: User) -> Trade:
        if trade.status != TradeStatus.PENDING:
            raise ValueError("Only pending trades can be approved")
        log_decision(
            db,
            portfolio_id=trade.portfolio_id,
            user_id=user.id,
            event_type=DecisionEventType.TRADE_APPROVED,
            payload={"trade_id": trade.id},
        )
        return self.execute_trade(db, trade=trade, user=user)

    def reject_trade(self, db: Session, *, trade: Trade, user: User) -> Trade:
        if trade.status != TradeStatus.PENDING:
            raise ValueError("Only pending trades can be rejected")
        trade.status = TradeStatus.REJECTED
        db.commit()
        db.refresh(trade)
        log_decision(
            db,
            portfolio_id=trade.portfolio_id,
            user_id=user.id,
            event_type=DecisionEventType.TRADE_REJECTED,
            payload={"trade_id": trade.id},
        )
        return trade

    def execute_trade(self, db: Session, *, trade: Trade, user: User) -> Trade:
        if trade.status not in (TradeStatus.PENDING, TradeStatus.APPROVED):
            raise ValueError("Trade is not executable")

        price = _resolve_execution_price(trade)
        _, realized_pnl = apply_trade_to_ledger(
            db,
            trade.portfolio_id,
            trade.symbol,
            trade.side.value,
            trade.quantity,
            price,
            trade.id,
        )
        trade.executed_price = price
        trade.realized_pnl = realized_pnl
        trade.status = TradeStatus.EXECUTED
        trade.executed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trade)

        portfolio = db.get(Portfolio, trade.portfolio_id)
        state = compute_portfolio_state(db, portfolio) if portfolio else {}

        if portfolio:
            settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
            risk = compute_risk_assessment(
                state,
                portfolio.target_allocations,
                settings.risk_profile if settings else RiskProfile.BALANCED,
            )
            for alert in risk.alerts:
                hub.broadcast(
                    trade.portfolio_id,
                    "risk.alert",
                    alert.model_dump(),
                )

        log_decision(
            db,
            portfolio_id=trade.portfolio_id,
            user_id=user.id,
            event_type=DecisionEventType.TRADE_EXECUTED,
            payload={
                "trade_id": trade.id,
                "executed_price": price,
                "realized_pnl": realized_pnl,
            },
        )

        hub.broadcast(
            trade.portfolio_id,
            "trade.executed",
            {
                "trade_id": trade.id,
                "symbol": trade.symbol,
                "side": trade.side.value,
                "quantity": trade.quantity,
                "executed_price": price,
                "realized_pnl": realized_pnl,
            },
        )
        if portfolio:
            hub.broadcast(
                trade.portfolio_id,
                "portfolio.update",
                {
                    "portfolio_id": portfolio.id,
                    "total_value": state.get("total_value"),
                    "cash_balance": state.get("cash_balance"),
                },
            )
        return trade


trade_service = TradeExecutionService()
