import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import AssetClass
from app.services import market_data as market_data_module
from app.services import ai as ai_module
from app.services import simulation as simulation_module
from app.services import trades as trades_module
from app.services import portfolio_metrics as portfolio_metrics_module
from app.services import dashboard_views as dashboard_views_module

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "trader@example.com", "password": "securepass123"},
    )
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


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

    stub = StubMarketData()
    monkeypatch.setattr(market_data_module, "market_data", stub)
    monkeypatch.setattr(market_data_module, "market_data_service", stub)
    monkeypatch.setattr(ai_module, "market_data", stub)
    monkeypatch.setattr(simulation_module, "market_data", stub)
    monkeypatch.setattr(trades_module, "market_data", stub)
    monkeypatch.setattr(portfolio_metrics_module, "market_data_service", stub)
    monkeypatch.setattr(dashboard_views_module, "market_data_service", stub)
