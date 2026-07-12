import json
from typing import Literal, Protocol

import httpx
from pydantic import BaseModel, Field

from app.config import Settings, get_settings


class AIProposal(BaseModel):
    action: Literal["HOLD", "REBALANCE_BUY", "REBALANCE_SELL"]
    symbol: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = Field(min_length=20, max_length=800)


class RecommendationProvider(Protocol):
    name: str
    model: str

    def propose(
        self,
        *,
        context: dict,
        allowed_actions: list[str],
        allowed_symbols: list[str],
    ) -> AIProposal: ...


class OllamaUnavailable(RuntimeError):
    pass


class OllamaRecommendationProvider:
    name = "ollama"

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.model = self.settings.ollama_model

    def propose(
        self,
        *,
        context: dict,
        allowed_actions: list[str],
        allowed_symbols: list[str],
    ) -> AIProposal:
        system_prompt = (
            "You are Pulsefolio's portfolio decision analyst for a paper-trading app. "
            "Choose only from the supplied actions and symbols. Prefer HOLD when evidence "
            "is weak and HOLD is allowed. REBALANCE_BUY means spending excess cash to add "
            "an underweight asset. REBALANCE_SELL means trimming an overweight holding to "
            "raise cash. Never reverse those meanings. Explain allocation, concentration, "
            "cash, and risk trade-offs in plain language. Never claim certainty or invent "
            "market news. Return only JSON matching the provided schema. /no_think"
        )
        user_prompt = json.dumps(
            {
                "task": "Select the safest useful portfolio recommendation.",
                "allowedActions": allowed_actions,
                "allowedSymbols": allowed_symbols,
                "portfolioContext": context,
                "requirements": {
                    "symbolMustBeNullForHold": True,
                    "actionSemantics": {
                        "REBALANCE_BUY": "buy an allowed underweight symbol using excess cash",
                        "REBALANCE_SELL": "sell an allowed overweight symbol to reduce exposure",
                        "HOLD": "make no trade",
                    },
                    "confidenceMeaning": "0 to 1; lower it when evidence is limited",
                    "rationale": "2-4 concise sentences grounded only in supplied numbers",
                },
            },
            separators=(",", ":"),
        )

        try:
            response = httpx.post(
                f"{self.settings.ollama_base_url.rstrip('/')}/api/chat",
                json={
                    "model": self.model,
                    "stream": False,
                    "think": False,
                    "keep_alive": "10m",
                    "format": AIProposal.model_json_schema(),
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "options": {
                        "temperature": self.settings.ollama_temperature,
                        "seed": 42,
                        "num_predict": 320,
                    },
                },
                timeout=self.settings.ollama_timeout_seconds,
            )
            response.raise_for_status()
            content = response.json()["message"]["content"]
            return AIProposal.model_validate_json(content)
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise OllamaUnavailable(f"Ollama recommendation failed: {type(exc).__name__}") from exc
