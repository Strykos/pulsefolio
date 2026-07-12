import asyncio
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth import decode_access_token, get_current_user
from app.database import SessionLocal, get_db
from app.models import DecisionLog, Portfolio, User
from app.schemas import DecisionLogResponse, MarketPricesResponse, PriceQuote
from app.services.market_data import market_data
from app.services.websocket import hub

router = APIRouter(tags=["stream"])


@router.get("/market/prices", response_model=MarketPricesResponse)
def get_market_prices() -> MarketPricesResponse:
    quotes = [
        PriceQuote(
            symbol=q["symbol"],
            asset_class=q["asset_class"],
            price=q["price"],
            change_percent=q["change_percent"],
            timestamp=datetime.fromisoformat(q["timestamp"]),
        )
        for q in market_data.get_all_prices()
    ]
    return MarketPricesResponse(prices=quotes)


@router.get("/decisions", response_model=list[DecisionLogResponse])
def list_decisions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    portfolio_id: str | None = Query(default=None),
    limit: int = Query(default=50, le=200),
) -> list[DecisionLogResponse]:
    query = db.query(DecisionLog).filter(DecisionLog.user_id == current_user.id)
    if portfolio_id:
        query = query.filter(DecisionLog.portfolio_id == portfolio_id)
    return query.order_by(DecisionLog.created_at.desc()).limit(limit).all()


@router.websocket("/stream")
async def websocket_stream(
    websocket: WebSocket,
    token: str | None = Query(default=None),
    portfolio_id: str | None = Query(default=None),
) -> None:
    user_id: str | None = None
    if token:
        try:
            user_id = decode_access_token(token)
        except Exception:
            await websocket.close(code=4401)
            return

    if portfolio_id and user_id:
        db = SessionLocal()
        try:
            portfolio = db.get(Portfolio, portfolio_id)
            if not portfolio or portfolio.user_id != user_id:
                await websocket.close(code=4403)
                return
        finally:
            db.close()

    await hub.connect(websocket, portfolio_id)
    await hub.send_event(
        websocket,
        "worker.heartbeat",
        {"status": "connected", "portfolio_id": portfolio_id},
    )

    tick_task = asyncio.create_task(_price_tick_loop(websocket, portfolio_id))

    try:
        while True:
            message = await websocket.receive_json()
            if message.get("type") == "ping":
                await hub.send_event(websocket, "worker.heartbeat", {"status": "pong"})
    except WebSocketDisconnect:
        pass
    finally:
        tick_task.cancel()
        hub.disconnect(websocket, portfolio_id)


async def _price_tick_loop(websocket: WebSocket, portfolio_id: str | None) -> None:
    while True:
        tick = market_data.tick()
        await hub.send_event(websocket, "price.tick", tick)
        await asyncio.sleep(5)
