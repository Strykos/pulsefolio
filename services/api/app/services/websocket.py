import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket


class WebSocketHub:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}
        self._global_connections: list[WebSocket] = []
        self._task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, portfolio_id: str | None = None) -> None:
        await websocket.accept()
        if portfolio_id:
            self._connections.setdefault(portfolio_id, []).append(websocket)
        else:
            self._global_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, portfolio_id: str | None = None) -> None:
        if portfolio_id and portfolio_id in self._connections:
            if websocket in self._connections[portfolio_id]:
                self._connections[portfolio_id].remove(websocket)
        if websocket in self._global_connections:
            self._global_connections.remove(websocket)

    async def send_event(
        self, websocket: WebSocket, event_type: str, data: dict[str, Any]
    ) -> None:
        await websocket.send_json(
            {
                "type": event_type,
                "data": data,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def broadcast(self, portfolio_id: str | None, event_type: str, data: dict[str, Any]) -> None:
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        targets: list[WebSocket] = list(self._global_connections)
        if portfolio_id:
            targets.extend(self._connections.get(portfolio_id, []))
        for ws in targets:
            asyncio.create_task(self._safe_send(ws, message))

    async def _safe_send(self, websocket: WebSocket, message: dict) -> None:
        try:
            await websocket.send_json(message)
        except Exception:
            pass

    async def start_heartbeat(self) -> None:
        if self._task and not self._task.done():
            return

        async def _loop() -> None:
            while True:
                self.broadcast(
                    None,
                    "worker.heartbeat",
                    {"status": "ok", "connections": self.connection_count()},
                )
                await asyncio.sleep(30)

        self._task = asyncio.create_task(_loop())

    def connection_count(self) -> int:
        scoped = sum(len(v) for v in self._connections.values())
        return scoped + len(self._global_connections)


hub = WebSocketHub()
