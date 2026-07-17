import os

import pytest


def test_render_cors_env_parses(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://pulsefolio-web.onrender.com,http://localhost:3000",
    )
    from app.config import get_settings

    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origin_list == [
        "https://pulsefolio-web.onrender.com",
        "http://localhost:3000",
    ]


def test_app_imports_with_render_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "CORS_ORIGINS",
        "https://pulsefolio-web.onrender.com,http://localhost:3000",
    )
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./render-smoke.db")
    monkeypatch.setenv("SECRET_KEY", "render-test-secret")
    monkeypatch.setenv("AI_PROVIDER", "rules")
    from app.config import get_settings

    get_settings.cache_clear()
    from app.main import app

    assert app.title == "Pulsefolio API"
    if os.path.exists("render-smoke.db"):
        os.remove("render-smoke.db")
