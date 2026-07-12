from datetime import datetime, timezone
from time import perf_counter

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    AIRecommendation,
    AssetClass,
    RecommendationStatus,
    RiskProfile,
)
from app.services.market_data import SYMBOL_META, market_data
from app.services.ollama import (
    AIProposal,
    OllamaRecommendationProvider,
    OllamaUnavailable,
    RecommendationProvider,
)
from app.services.risk import CRYPTO_CAP, MAX_SINGLE_ASSET, compute_risk_assessment
from app.services.simulation import compute_portfolio_state


def _largest_drift(portfolio_state: dict, targets: dict[str, float]) -> tuple[str, float, str | None]:
    total = portfolio_state["total_value"]
    class_weights: dict[str, float] = {ac.value: 0.0 for ac in AssetClass}
    class_weights[AssetClass.CASH.value] = (portfolio_state["cash_balance"] / total * 100) if total else 100

    symbol_by_class: dict[str, str | None] = {}
    for row in portfolio_state["positions"]:
        ac = row["position"].asset_class.value
        class_weights[ac] = class_weights.get(ac, 0.0) + row["weight_percent"]
        if row["weight_percent"] > 5:
            symbol_by_class[ac] = row["position"].symbol

    drifts: dict[str, float] = {}
    for ac, target in targets.items():
        actual = class_weights.get(ac, 0.0)
        drifts[ac] = actual - target

    best_class, best_drift = max(
        drifts.items(),
        key=lambda item: abs(item[1]),
        default=("", 0.0),
    )

    # Cash is not directly tradable. Convert cash drift into the most useful
    # investable correction: buy the most underweight class when cash is high,
    # or sell the most overweight class when cash is low.
    if best_class == AssetClass.CASH.value:
        investable = {
            asset_class: drift
            for asset_class, drift in drifts.items()
            if asset_class != AssetClass.CASH.value
        }
        if best_drift > 0:
            best_class, best_drift = min(
                investable.items(),
                key=lambda item: item[1],
                default=(best_class, best_drift),
            )
        else:
            best_class, best_drift = max(
                investable.items(),
                key=lambda item: item[1],
                default=(best_class, best_drift),
            )

    symbol = symbol_by_class.get(best_class)
    return best_class, best_drift, symbol


class AIRecommendationService:
    """Hybrid AI recommendations with deterministic portfolio guardrails."""

    PROMPT_VERSION = "portfolio-decision-v1"

    def __init__(self, provider: RecommendationProvider | None = None) -> None:
        settings = get_settings()
        self.provider = provider
        if provider is None and settings.ai_provider == "ollama":
            self.provider = OllamaRecommendationProvider(settings)

    def generate(
        self,
        db: Session,
        portfolio,
        risk_profile: RiskProfile = RiskProfile.BALANCED,
    ) -> AIRecommendation:
        state = compute_portfolio_state(db, portfolio)
        assessment = compute_risk_assessment(state, portfolio.target_allocations, risk_profile)
        asset_class, drift, symbol = _largest_drift(state, portfolio.target_allocations)
        allowed_actions, allowed_symbols = self._allowed_candidates(
            state=state,
            asset_class=asset_class,
            drift=drift,
        )

        started = perf_counter()
        provider_used = "rules"
        fallback_reason: str | None = None
        rule_proposal = self._rule_proposal(
            asset_class=asset_class,
            drift=drift,
            symbol=symbol,
        )
        proposal = rule_proposal

        if self.provider is not None:
            try:
                candidate = self.provider.propose(
                    context=self._build_context(
                        state=state,
                        targets=portfolio.target_allocations,
                        risk_profile=risk_profile,
                        assessment=assessment,
                        asset_class=asset_class,
                        drift=drift,
                    ),
                    allowed_actions=allowed_actions,
                    allowed_symbols=allowed_symbols,
                )
                proposal = self._validate_proposal(
                    candidate,
                    allowed_actions=allowed_actions,
                    allowed_symbols=allowed_symbols,
                )
                provider_used = self.provider.name
                if (
                    proposal.action == "HOLD"
                    and abs(drift) >= 3.0
                    and rule_proposal.action != "HOLD"
                ):
                    proposal = self._validate_proposal(
                        rule_proposal,
                        allowed_actions=allowed_actions,
                        allowed_symbols=allowed_symbols,
                    )
                    provider_used = "hybrid"
                    fallback_reason = "ollama_hold_drift_override"
            except (OllamaUnavailable, ValueError) as exc:
                fallback_reason = type(exc).__name__

        action = proposal.action
        symbol = proposal.symbol
        confidence = proposal.confidence
        rationale = proposal.rationale
        risk_impact, return_impact = self._impact_for(action, drift)

        quantity = (
            self._suggest_quantity(state, symbol, drift, action)
            if symbol and action != "HOLD"
            else None
        )
        guardrail_status = "passed"
        if action != "HOLD" and not quantity:
            guardrail_status = "blocked"
            action = "HOLD"
            symbol = None
            confidence = min(confidence, 0.7)
            risk_impact = 0.0
            return_impact = 0.0
            rationale = (
                f"{rationale} No trade was created because cash or position limits "
                "left no safe executable quantity."
            )

        payload = {
            "riskImpact": risk_impact,
            "expectedReturnImpact": return_impact,
            "rationale": rationale,
            "riskScore": assessment.score,
            "alerts": [a.model_dump() for a in assessment.alerts],
            "suggestedSymbol": symbol,
            "suggestedQuantity": quantity,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "ai": {
                "provider": provider_used,
                "model": self.provider.model if provider_used != "rules" and self.provider else None,
                "promptVersion": self.PROMPT_VERSION,
                "latencyMs": round((perf_counter() - started) * 1000),
                "fallbackReason": fallback_reason,
                "guardrailStatus": guardrail_status,
                "allowedActions": allowed_actions,
                "allowedSymbols": allowed_symbols,
            },
        }

        db.query(AIRecommendation).filter(
            AIRecommendation.portfolio_id == portfolio.id,
            AIRecommendation.status == RecommendationStatus.ACTIVE,
        ).update(
            {AIRecommendation.status: RecommendationStatus.DISMISSED},
            synchronize_session=False,
        )

        rec = AIRecommendation(
            portfolio_id=portfolio.id,
            action=action,
            symbol=symbol,
            confidence=round(confidence, 2),
            risk_impact=risk_impact,
            expected_return_impact=return_impact,
            rationale=rationale,
            payload=payload,
            status=RecommendationStatus.ACTIVE,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    def _allowed_candidates(
        self,
        *,
        state: dict,
        asset_class: str,
        drift: float,
    ) -> tuple[list[str], list[str]]:
        if abs(drift) < 3.0:
            return ["HOLD"], []

        if drift > 0:
            symbols = [
                row["position"].symbol
                for row in sorted(
                    state["positions"],
                    key=lambda row: row["weight_percent"],
                    reverse=True,
                )
                if row["position"].asset_class.value == asset_class
            ]
            actions = (
                ["REBALANCE_SELL"]
                if symbols and abs(drift) >= 10.0
                else ["HOLD", "REBALANCE_SELL"] if symbols else ["HOLD"]
            )
            return actions, symbols

        symbols = [
            symbol
            for symbol, meta in SYMBOL_META.items()
            if meta["asset_class"].value == asset_class and symbol != "CASH"
        ]
        actions = (
            ["REBALANCE_BUY"]
            if symbols and abs(drift) >= 10.0
            else ["HOLD", "REBALANCE_BUY"] if symbols else ["HOLD"]
        )
        return actions, symbols

    def _build_context(
        self,
        *,
        state: dict,
        targets: dict[str, float],
        risk_profile: RiskProfile,
        assessment,
        asset_class: str,
        drift: float,
    ) -> dict:
        positions = []
        for row in state["positions"]:
            position = row["position"]
            cost = position.quantity * position.avg_cost
            pnl_percent = ((row["market_value"] - cost) / cost * 100) if cost else 0.0
            positions.append(
                {
                    "symbol": position.symbol,
                    "assetClass": position.asset_class.value,
                    "quantity": round(position.quantity, 4),
                    "marketPrice": round(row["market_price"], 4),
                    "marketValue": round(row["market_value"], 2),
                    "weightPercent": round(row["weight_percent"], 2),
                    "unrealizedPnlPercent": round(pnl_percent, 2),
                }
            )

        total = state["total_value"]
        cash_percent = (state["cash_balance"] / total * 100) if total else 100.0
        return {
            "totalValue": round(total, 2),
            "cashBalance": round(state["cash_balance"], 2),
            "cashPercent": round(cash_percent, 2),
            "riskProfile": risk_profile.value,
            "riskScore": assessment.score,
            "riskLabel": assessment.label,
            "riskAlerts": [alert.model_dump() for alert in assessment.alerts],
            "targetAllocations": targets,
            "allocationDrift": assessment.allocation_drift,
            "largestDrift": {
                "assetClass": asset_class,
                "percentagePoints": round(drift, 2),
            },
            "positions": positions,
            "dataLimitations": [
                "Prices are simulated paper-trading prices.",
                "No external news, fundamentals, or future price data is available.",
            ],
        }

    def _validate_proposal(
        self,
        proposal: AIProposal,
        *,
        allowed_actions: list[str],
        allowed_symbols: list[str],
    ) -> AIProposal:
        symbol = proposal.symbol.upper() if proposal.symbol else None
        if proposal.action not in allowed_actions:
            raise ValueError("Model selected a disallowed action")
        if proposal.action == "HOLD":
            return proposal.model_copy(update={"symbol": None})
        if symbol not in allowed_symbols:
            raise ValueError("Model selected a disallowed symbol")
        return proposal.model_copy(update={"symbol": symbol})

    def _rule_proposal(
        self,
        *,
        asset_class: str,
        drift: float,
        symbol: str | None,
    ) -> AIProposal:
        if abs(drift) < 3.0:
            return AIProposal(
                action="HOLD",
                symbol=None,
                confidence=0.62,
                rationale=(
                    "Portfolio allocations are within rebalance bands. "
                    "No trade is recommended at this time."
                ),
            )
        if drift > 0 and symbol:
            return AIProposal(
                action="REBALANCE_SELL",
                symbol=symbol,
                confidence=min(0.95, 0.65 + abs(drift) * 0.02),
                rationale=(
                    f"{asset_class.replace('_', ' ').title()} is overweight by {drift:.1f} "
                    "percentage points. Trimming the largest eligible holding would reduce "
                    "concentration and move the portfolio toward its target."
                ),
            )

        default_symbol = {
            "etf": "VTI",
            "stock": "AAPL",
            "bond": "BND",
            "crypto": "BTC",
            "commodity": "GLD",
        }.get(asset_class)
        if default_symbol:
            return AIProposal(
                action="REBALANCE_BUY",
                symbol=default_symbol,
                confidence=min(0.95, 0.70 + abs(drift) * 0.02),
                rationale=(
                    f"{asset_class.replace('_', ' ').title()} is underweight by "
                    f"{abs(drift):.1f} percentage points. A measured addition to "
                    f"{default_symbol} would improve target alignment while retaining cash."
                ),
            )
        return AIProposal(
            action="HOLD",
            symbol=None,
            confidence=0.55,
            rationale=(
                "The allocation drift cannot be corrected with an eligible instrument. "
                "No trade is recommended."
            ),
        )

    def _impact_for(self, action: str, drift: float) -> tuple[float, float]:
        if action == "REBALANCE_SELL":
            return (
                -round(min(0.5, abs(drift) * 0.02), 2),
                round(-abs(drift) * 0.01, 2),
            )
        if action == "REBALANCE_BUY":
            return (
                round(min(0.3, abs(drift) * 0.015), 2),
                round(abs(drift) * 0.012, 2),
            )
        return 0.0, 0.0

    def _suggest_quantity(
        self,
        state: dict,
        symbol: str | None,
        drift: float,
        action: str,
    ) -> float | None:
        if not symbol:
            return None
        try:
            price = market_data.get_price(symbol)
        except ValueError:
            return None

        notional = state["total_value"] * (abs(drift) / 100) * 0.5
        if action == "REBALANCE_BUY":
            cash_floor = state["total_value"] * 0.05
            available_cash = max(0.0, state["cash_balance"] - cash_floor)
            notional = min(notional, available_cash)

            current_symbol_value = sum(
                row["market_value"]
                for row in state["positions"]
                if row["position"].symbol == symbol
            )
            single_asset_room = max(
                0.0,
                state["total_value"] * (MAX_SINGLE_ASSET / 100) - current_symbol_value,
            )
            notional = min(notional, single_asset_room)

            if market_data.get_asset_class(symbol) == AssetClass.CRYPTO:
                current_crypto_value = sum(
                    row["market_value"]
                    for row in state["positions"]
                    if row["position"].asset_class == AssetClass.CRYPTO
                )
                crypto_room = max(
                    0.0,
                    state["total_value"] * (CRYPTO_CAP / 100) - current_crypto_value,
                )
                notional = min(notional, crypto_room)
        elif action == "REBALANCE_SELL":
            position_row = next(
                (
                    row
                    for row in state["positions"]
                    if row["position"].symbol == symbol
                ),
                None,
            )
            if not position_row:
                return None
            notional = min(notional, position_row["market_value"])

        if notional <= 0 or price <= 0:
            return None
        qty = notional / price
        if symbol in ("BTC", "ETH"):
            rounded = round(qty, 4)
        else:
            rounded = round(qty, 2)
        return rounded if rounded > 0 else None


ai_service = AIRecommendationService()
