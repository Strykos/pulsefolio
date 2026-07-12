from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import AIRecommendation, User, UserSettings
from app.services.ai import ai_service
from app.services.ollama import AIProposal

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


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_login(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert register.status_code == 201
    assert "access_token" in register.json()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert "refresh_token" in login.json()


def test_portfolio_crud_and_trade_flow(client, auth_headers):
    created = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Paper Portfolio"},
    )
    assert created.status_code == 201
    portfolio = created.json()
    assert portfolio["summary"]["cash_balance"] == 100000.0

    portfolio_id = portfolio["id"]

    risk = client.get(f"/api/v1/portfolios/{portfolio_id}/risk", headers=auth_headers)
    assert risk.status_code == 200
    assert 1 <= risk.json()["score"] <= 10

    trade = client.post(
        "/api/v1/trades",
        headers=auth_headers,
        json={
            "portfolio_id": portfolio_id,
            "symbol": "AAPL",
            "side": "buy",
            "quantity": 10,
        },
    )
    assert trade.status_code == 201
    assert trade.json()["status"] == "pending"

    approved = client.post(
        f"/api/v1/trades/{trade.json()['id']}/approve",
        headers=auth_headers,
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "executed"

    detail = client.get(f"/api/v1/portfolios/{portfolio_id}", headers=auth_headers)
    assert detail.status_code == 200
    assert len(detail.json()["positions"]) == 1


def test_ai_recommendation(client, auth_headers):
    portfolio = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "AI Test"},
    ).json()

    rec = client.post(
        "/api/v1/ai/recommendations",
        headers=auth_headers,
        json={"portfolio_id": portfolio["id"]},
    )
    assert rec.status_code == 201
    body = rec.json()
    assert "risk_impact" in body
    assert "expected_return_impact" in body
    assert "rationale" in body
    assert body["payload"]["riskImpact"] == body["risk_impact"]


def test_ai_uses_structured_provider_and_records_metadata(client, auth_headers, monkeypatch):
    class FakeProvider:
        name = "fake"
        model = "test-model"

        def propose(self, *, context, allowed_actions, allowed_symbols):
            assert context["cashPercent"] == 100.0
            assert allowed_actions == ["REBALANCE_BUY"]
            assert {"AAPL", "MSFT"}.issubset(set(allowed_symbols))
            return AIProposal(
                action="REBALANCE_BUY",
                symbol="AAPL",
                confidence=0.88,
                rationale=(
                    "The portfolio is entirely in cash while stocks are materially "
                    "underweight. A measured AAPL purchase improves target alignment."
                ),
            )

    monkeypatch.setattr(ai_service, "provider", FakeProvider())
    portfolio = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Provider Test"},
    ).json()

    response = client.post(
        "/api/v1/ai/recommendations",
        headers=auth_headers,
        json={"portfolio_id": portfolio["id"]},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["action"] == "REBALANCE_BUY"
    assert body["symbol"] == "AAPL"
    assert body["confidence"] == 0.88
    assert body["payload"]["ai"]["provider"] == "fake"
    assert body["payload"]["ai"]["model"] == "test-model"
    assert body["payload"]["ai"]["guardrailStatus"] == "passed"


def test_ai_guardrail_rejects_disallowed_proposal(client, auth_headers, monkeypatch):
    class UnsafeProvider:
        name = "unsafe"
        model = "test-model"

        def propose(self, *, context, allowed_actions, allowed_symbols):
            return AIProposal(
                action="REBALANCE_BUY",
                symbol="BTC",
                confidence=0.99,
                rationale=(
                    "Buy Bitcoin despite the supplied constraints because the model "
                    "incorrectly assumes future appreciation."
                ),
            )

    monkeypatch.setattr(ai_service, "provider", UnsafeProvider())
    portfolio = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Guardrail Test"},
    ).json()

    response = client.post(
        "/api/v1/ai/recommendations",
        headers=auth_headers,
        json={"portfolio_id": portfolio["id"]},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["action"] == "REBALANCE_BUY"
    assert body["symbol"] == "AAPL"
    assert body["payload"]["ai"]["provider"] == "rules"
    assert body["payload"]["ai"]["fallbackReason"] == "ValueError"


def test_settings_auto_mode(client, auth_headers):
    response = client.patch(
        "/api/v1/settings",
        headers=auth_headers,
        json={"auto_trade_enabled": True, "risk_profile": "growth"},
    )
    assert response.status_code == 200
    assert response.json()["auto_trade_enabled"] is True
    assert response.json()["risk_profile"] == "growth"


def test_market_prices(client):
    response = client.get("/api/v1/market/prices")
    assert response.status_code == 200
    symbols = {q["symbol"] for q in response.json()["prices"]}
    assert {"AAPL", "MSFT", "VTI", "BND", "BTC", "ETH", "GLD"}.issubset(symbols)


def test_decision_log(client, auth_headers):
    portfolio = client.post(
        "/api/v1/portfolios",
        headers=auth_headers,
        json={"name": "Audit"},
    ).json()
    logs = client.get(
        "/api/v1/decisions",
        headers=auth_headers,
        params={"portfolio_id": portfolio["id"]},
    )
    assert logs.status_code == 200
    assert len(logs.json()) >= 1


def test_dashboard_endpoints(client, db_session, monkeypatch):
    # The public request seeds the shared demo portfolio; generate a fresh
    # recommendation explicitly so this test also covers the approval route.
    monkeypatch.setattr(ai_service, "provider", None)
    client.get("/api/v1/public/dashboard")
    generated = client.post("/api/v1/public/recommendations/generate")
    assert generated.status_code == 200
    assert generated.json()["provider"] == "rules"
    assert generated.json()["guardrailStatus"] == "passed"

    dashboard = client.get("/api/v1/public/dashboard")
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert "portfolio" in body
    assert body["portfolio"]["totalValue"] > 0
    assert body["recommendation"]["id"]
    assert body["recommendation"]["guardrailStatus"] == "passed"
    assert isinstance(body["portfolio"]["riskAlerts"], list)
    assert isinstance(body["portfolio"]["allocationDrift"], dict)

    stored = db_session.get(AIRecommendation, body["recommendation"]["id"])
    assert stored is not None
    recommendation = body["recommendation"]
    assert recommendation["suggestedQuantity"] == stored.payload["suggestedQuantity"]
    assert recommendation["analysisTimestamp"] == stored.payload["generatedAt"]
    assert recommendation["alerts"] == stored.payload["alerts"]
    assert recommendation["guardrailEvidence"] == {
        "promptVersion": stored.payload["ai"]["promptVersion"],
        "fallbackReason": stored.payload["ai"]["fallbackReason"],
        "allowedActions": stored.payload["ai"]["allowedActions"],
        "allowedSymbols": stored.payload["ai"]["allowedSymbols"],
    }
    generated_at = datetime.fromisoformat(recommendation["analysisTimestamp"])
    expected_age = int((datetime.now(timezone.utc) - generated_at).total_seconds())
    assert 0 <= recommendation["analysisAgeSeconds"] <= expected_age + 1

    if body["recommendation"]["action"] != "HOLD":
        approved = client.post(
            f"/api/v1/public/recommendations/{body['recommendation']['id']}/approve"
        )
        assert approved.status_code == 200
        assert approved.json()["status"] == "pending"

    portfolio = client.get("/api/v1/public/portfolio")
    assert portfolio.status_code == 200
    portfolio_body = portfolio.json()
    assert "assetClasses" in portfolio_body
    assert portfolio_body["riskAlerts"] == body["portfolio"]["riskAlerts"]
    assert portfolio_body["allocationDrift"] == body["portfolio"]["allocationDrift"]

    settings = client.patch("/api/v1/public/settings", json={"mode": "auto"})
    assert settings.status_code == 200
    assert settings.json()["mode"] == "auto"
