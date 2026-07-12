import pytest

from app.models import AssetClass
from app.services import market_data as market_data_module


@pytest.fixture(autouse=True)
def stub_live_market_data(monkeypatch):
    """Keep unit tests offline while production uses Yahoo Finance."""

    class StubMarketData:
        _quotes = {
            "AAPL": {"price": 168.42, "previous_close": 167.0, "change_percent": 0.85},
            "MSFT": {"price": 403.55, "previous_close": 401.0, "change_percent": 0.64},
            "VTI": {"price": 245.10, "previous_close": 244.0, "change_percent": 0.45},
            "BND": {"price": 72.35, "previous_close": 72.1, "change_percent": 0.35},
            "BTC": {"price": 42000.0, "previous_close": 41500.0, "change_percent": 1.2},
            "ETH": {"price": 2280.0, "previous_close": 2250.0, "change_percent": 1.33},
            "GLD": {"price": 185.20, "previous_close": 184.5, "change_percent": 0.38},
        }
        _history = {symbol: [q["previous_close"], q["price"]] for symbol, q in _quotes.items()}

        def get_price(self, symbol: str) -> float:
            if symbol.upper() == "CASH":
                return 1.0
            return self._quotes[symbol.upper()]["price"]

        def get_previous_close(self, symbol: str) -> float:
            if symbol.upper() == "CASH":
                return 1.0
            return self._quotes[symbol.upper()]["previous_close"]

        def get_asset_class(self, symbol: str) -> AssetClass:
            return market_data_module.SYMBOL_META[symbol.upper()]["asset_class"]

        def get_change_percent(self, symbol: str) -> float:
            if symbol.upper() == "CASH":
                return 0.0
            return self._quotes[symbol.upper()]["change_percent"]

        def get_history(self, symbol: str) -> list[float]:
            if symbol.upper() == "CASH":
                return [1.0]
            return list(self._history[symbol.upper()])

        def tick(self, symbol: str | None = None) -> dict:
            symbols = [symbol.upper()] if symbol else list(self._quotes.keys())
            return {
                "prices": [
                    {
                        "symbol": sym,
                        "asset_class": self.get_asset_class(sym).value,
                        "price": self._quotes[sym]["price"],
                        "change_percent": self._quotes[sym]["change_percent"],
                        "timestamp": "2026-07-12T00:00:00+00:00",
                    }
                    for sym in symbols
                ]
            }

        def get_all_prices(self) -> list[dict]:
            return self.tick()["prices"]

        def get_name(self, symbol: str) -> str:
            return market_data_module.NAMES.get(symbol.upper(), symbol)

    monkeypatch.setattr(market_data_module, "market_data", StubMarketData())
    monkeypatch.setattr(market_data_module, "market_data_service", StubMarketData())
