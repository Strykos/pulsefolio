import json
from functools import lru_cache

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(value: object) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if value is None:
        return []
    raw = str(value).strip()
    if not raw:
        return []
    if raw.startswith("["):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parse_cors_origins(parsed)
        except json.JSONDecodeError:
            pass
    origins: list[str] = []
    for part in raw.split(","):
        origin = part.strip()
        if not origin:
            continue
        if not origin.startswith(("http://", "https://")):
            origin = f"https://{origin}"
        origins.append(origin)
    return origins


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Pulsefolio API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./pulsefolio.db"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    initial_cash: float = 100_000.0
    # Plain str so Render/comma-separated env vars don't hit pydantic JSON decode.
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    ai_provider: str = "ollama"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3:4b"
    ollama_timeout_seconds: float = 90.0
    ollama_temperature: float = 0.15

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> list[str]:
        return parse_cors_origins(self.cors_origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
