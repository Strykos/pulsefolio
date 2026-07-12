from __future__ import annotations

from datetime import datetime, timezone
from time import time
from typing import Any

import httpx

from app.models import AssetClass

SYMBOL_META: dict[str, dict] = {
    "AAPL": {"asset_class": AssetClass.STOCK, "yahoo": "AAPL"},
    "MSFT": {"asset_class": AssetClass.STOCK, "yahoo": "MSFT"},
    "VTI": {"asset_class": AssetClass.ETF, "yahoo": "VTI"},
    "BND": {"asset_class": AssetClass.BOND, "yahoo": "BND"},
    "BTC": {"asset_class": AssetClass.CRYPTO, "yahoo": "BTC-USD"},
    "ETH": {"asset_class": AssetClass.CRYPTO, "yahoo": "ETH-USD"},
    "GLD": {"asset_class": AssetClass.COMMODITY, "yahoo": "GLD"},
    "CASH": {"asset_class": AssetClass.CASH, "yahoo": None},
}

NAMES = {
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp.",
    "VTI": "Vanguard Total Stock",
    "BND": "Vanguard Total Bond",
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "GLD": "SPDR Gold Shares",
}


class MarketDataUnavailable(RuntimeError):
    pass


class YahooMarketDataAdapter:
    """Live quotes and history from Yahoo Finance."""

    _CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    _TTL_SECONDS = 60

    def __init__(self) -> None:
        self._quotes: dict[str, dict[str, Any]] = {}
        self._history: dict[str, list[float]] = {}
        self._loaded_at: float = 0.0

    def _ensure_loaded(self) -> None:
        if self._quotes and (time() - self._loaded_at) < self._TTL_SECONDS:
            return
        quotes: dict[str, dict[str, Any]] = {}
        history: dict[str, list[float]] = {}
        with httpx.Client(timeout=12.0, headers={"User-Agent": "Pulsefolio/1.0"}) as client:
            for symbol, meta in SYMBOL_META.items():
                yahoo_symbol = meta.get("yahoo")
                if not yahoo_symbol:
                    continue
                response = client.get(
                    self._CHART_URL.format(symbol=yahoo_symbol),
                    params={"interval": "1d", "range": "1mo"},
                )
                response.raise_for_status()
                result = response.json()["chart"]["result"][0]
                market = result["meta"]
                price = float(market["regularMarketPrice"])
                previous_close = float(market.get("chartPreviousClose") or market.get("previousClose") or price)
                change_percent = ((price - previous_close) / previous_close * 100) if previous_close else 0.0
                closes = [
                    float(value)
                    for value in result["indicators"]["quote"][0]["close"]
                    if value is not None
                ]
                quotes[symbol] = {
                    "price": round(price, 4),
                    "previous_close": round(previous_close, 4),
                    "change_percent": round(change_percent, 3),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                history[symbol] = closes[-30:]
        if not quotes:
            raise MarketDataUnavailable("No live market quotes returned")
        self._quotes = quotes
        self._history = history
        self._loaded_at = time()

    def get_price(self, symbol: str) -> float:
        sym = symbol.upper()
        if sym == "CASH":
            return 1.0
        self._ensure_loaded()
        quote = self._quotes.get(sym)
        if not quote:
            raise ValueError(f"Unknown symbol: {symbol}")
        return quote["price"]

    def get_previous_close(self, symbol: str) -> float:
        sym = symbol.upper()
        if sym == "CASH":
            return 1.0
        self._ensure_loaded()
        quote = self._quotes.get(sym)
        if not quote:
            raise ValueError(f"Unknown symbol: {symbol}")
        return quote["previous_close"]

    def get_asset_class(self, symbol: str) -> AssetClass:
        meta = SYMBOL_META.get(symbol.upper())
        if not meta:
            raise ValueError(f"Unknown symbol: {symbol}")
        return meta["asset_class"]

    def get_change_percent(self, symbol: str) -> float:
        sym = symbol.upper()
        if sym == "CASH":
            return 0.0
        self._ensure_loaded()
        return self._quotes[sym]["change_percent"]

    def get_history(self, symbol: str) -> list[float]:
        sym = symbol.upper()
        if sym == "CASH":
            return [1.0]
        self._ensure_loaded()
        return list(self._history.get(sym, []))

    def tick(self, symbol: str | None = None) -> dict:
        self._ensure_loaded()
        symbols = [symbol.upper()] if symbol else [s for s in SYMBOL_META if s != "CASH"]
        quotes = []
        for sym in symbols:
            quote = self._quotes[sym]
            quotes.append(
                {
                    "symbol": sym,
                    "asset_class": SYMBOL_META[sym]["asset_class"].value,
                    "price": quote["price"],
                    "change_percent": quote["change_percent"],
                    "timestamp": quote["timestamp"],
                }
            )
        return {"prices": quotes}

    def get_all_prices(self) -> list[dict]:
        return self.tick()["prices"]

    def get_name(self, symbol: str) -> str:
        return NAMES.get(symbol.upper(), symbol)


market_data = YahooMarketDataAdapter()
market_data_service = market_data
