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
from app.services.risk import CRYPTO_CAP, MAX_SINGLE_ASSET, MIN_CASH, compute_risk_assessment
from app.services.simulation import compute_portfolio_state


# Prefer higher-expected-return instruments when buying into an underweight class.
_BUY_PREFERENCE: dict[str, list[str]] = {
    "stock": ["MSFT", "AAPL"],
    "etf": ["VTI"],
    "bond": ["BND"],
    "crypto": ["BTC", "ETH"],
    "commodity": ["GLD"],
}


def _cash_percent(state: dict) -> float:
    total = state["total_value"]
    return (state["cash_balance"] / total * 100) if total else 100.0


def _class_weights(state: dict) -> dict[str, float]:
    total = state["total_value"]
    weights: dict[str, float] = {ac.value: 0.0 for ac in AssetClass}
    weights[AssetClass.CASH.value] = _cash_percent(state) if total else 100.0
    for row in state["positions"]:
        ac = row["position"].asset_class.value
        weights[ac] = weights.get(ac, 0.0) + row["weight_percent"]
    return weights


def _momentum(symbol: str) -> float:
    try:
        return float(market_data.get_change_percent(symbol))
    except Exception:
        return 0.0


def _unrealized_pnl_percent(row: dict) -> float:
    position = row["position"]
    cost = position.quantity * position.avg_cost
    if not cost:
        return 0.0
    return ((row["market_value"] - cost) / cost) * 100


def _best_buy_symbol(asset_class: str) -> str | None:
    preferred = _BUY_PREFERENCE.get(asset_class, [])
    candidates = preferred or [
        symbol
        for symbol, meta in SYMBOL_META.items()
        if meta["asset_class"].value == asset_class and symbol != "CASH"
    ]
    if not candidates:
        return None
    # Momentum tilt: buy the strongest recent performer in the underweight class.
    return max(
        candidates,
        key=lambda symbol: (
            _momentum(symbol),
            -(preferred.index(symbol) if symbol in preferred else 99),
        ),
    )


def _best_sell_symbol(state: dict, asset_class: str | None = None) -> str | None:
    rows = [
        row
        for row in state["positions"]
        if row["position"].quantity > 0
        and (asset_class is None or row["position"].asset_class.value == asset_class)
    ]
    if not rows:
        return None
    # Trim concentration first; among equals prefer locking in gains.
    return max(
        rows,
        key=lambda row: (row["weight_percent"], _unrealized_pnl_percent(row)),
    )["position"].symbol


def _priority_rebalance(
    state: dict, targets: dict[str, float]
) -> tuple[str, float, str | None, str]:
    """Choose the highest-priority rebalance action for risk-adjusted profits.

    Priority:
    1. Restore cash floor via sells of the largest / most profitable overweight.
    2. Trim single-asset concentration.
    3. Correct the largest allocation drift (sell overweight / buy underweight).
    """
    weights = _class_weights(state)
    cash_pct = weights[AssetClass.CASH.value]

    max_row = max(
        (row for row in state["positions"] if row["position"].quantity > 0),
        key=lambda row: row["weight_percent"],
        default=None,
    )
    if max_row and max_row["weight_percent"] > MAX_SINGLE_ASSET:
        symbol = max_row["position"].symbol
        asset_class = max_row["position"].asset_class.value
        excess = max_row["weight_percent"] - MAX_SINGLE_ASSET
        return asset_class, excess, symbol, "concentration"

    if cash_pct < MIN_CASH:
        investable = {
            asset_class: weights.get(asset_class, 0.0) - target
            for asset_class, target in targets.items()
            if asset_class != AssetClass.CASH.value
        }
        asset_class, drift = max(
            investable.items(),
            key=lambda item: item[1],
            default=(AssetClass.STOCK.value, 0.0),
        )
        # Sell enough to refill the cash floor even if classes are near target.
        needed = MIN_CASH - cash_pct
        sell_drift = max(drift, needed)
        symbol = _best_sell_symbol(state, asset_class) or _best_sell_symbol(state)
        return asset_class, sell_drift, symbol, "cash_floor"

    drifts: dict[str, float] = {}
    for asset_class, target in targets.items():
        drifts[asset_class] = weights.get(asset_class, 0.0) - target

    best_class, best_drift = max(
        drifts.items(),
        key=lambda item: abs(item[1]),
        default=("", 0.0),
    )

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

    if best_drift > 0:
        symbol = _best_sell_symbol(state, best_class)
        return best_class, best_drift, symbol, "drift_sell"

    symbol = _best_buy_symbol(best_class)
    return best_class, best_drift, symbol, "drift_buy"


class AIRecommendationService:
    """Hybrid AI recommendations with deterministic portfolio guardrails."""

    PROMPT_VERSION = "portfolio-decision-v2"

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
        asset_class, drift, symbol, reason = _priority_rebalance(
            state, portfolio.target_allocations
        )
        allowed_actions, allowed_symbols = self._allowed_candidates(
            state=state,
            asset_class=asset_class,
            drift=drift,
            reason=reason,
        )

        started = perf_counter()
        provider_used = "rules"
        fallback_reason: str | None = None
        rule_proposal = self._rule_proposal(
            asset_class=asset_class,
            drift=drift,
            symbol=symbol,
            reason=reason,
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
                        reason=reason,
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
        risk_impact, return_impact = self._impact_for(action, drift, reason)

        quantity = (
            self._suggest_quantity(state, symbol, drift, action, reason)
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
            "priorityReason": reason,
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
        reason: str,
    ) -> tuple[list[str], list[str]]:
        cash_pct = _cash_percent(state)

        # Never buy when cash is below the floor — restore liquidity first.
        if reason in {"cash_floor", "concentration"} or cash_pct < MIN_CASH:
            symbols = [
                row["position"].symbol
                for row in sorted(
                    state["positions"],
                    key=lambda row: (row["weight_percent"], _unrealized_pnl_percent(row)),
                    reverse=True,
                )
                if row["position"].quantity > 0
            ]
            seen: set[str] = set()
            ordered: list[str] = []
            for symbol in symbols:
                if symbol not in seen:
                    seen.add(symbol)
                    ordered.append(symbol)
            if not ordered:
                return ["HOLD"], []
            return ["REBALANCE_SELL"], ordered

        if abs(drift) < 3.0:
            return ["HOLD"], []

        if drift > 0:
            symbols = [
                row["position"].symbol
                for row in sorted(
                    state["positions"],
                    key=lambda row: (row["weight_percent"], _unrealized_pnl_percent(row)),
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

        symbols = list(
            dict.fromkeys(
                (_BUY_PREFERENCE.get(asset_class) or [])
                + [
                    symbol
                    for symbol, meta in SYMBOL_META.items()
                    if meta["asset_class"].value == asset_class and symbol != "CASH"
                ]
            )
        )
        # Rank buy candidates by recent momentum for better expected return.
        symbols = sorted(symbols, key=_momentum, reverse=True)
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
        reason: str,
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
                    "dayChangePercent": round(_momentum(position.symbol), 3),
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
                "reason": reason,
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
        reason: str,
    ) -> AIProposal:
        if reason == "concentration" and symbol:
            return AIProposal(
                action="REBALANCE_SELL",
                symbol=symbol,
                confidence=0.92,
                rationale=(
                    f"{symbol} exceeds the single-asset concentration limit. "
                    "Trimming the position locks in gains, lowers risk, and frees "
                    "cash for better-balanced growth."
                ),
            )
        if reason == "cash_floor" and symbol:
            return AIProposal(
                action="REBALANCE_SELL",
                symbol=symbol,
                confidence=0.9,
                rationale=(
                    f"Cash is below the {MIN_CASH:.0f}% floor. Selling {symbol} "
                    "restores dry powder so the portfolio can buy dips and meet "
                    "risk guardrails without forced liquidation later."
                ),
            )
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

        default_symbol = symbol or _best_buy_symbol(asset_class)
        if default_symbol:
            momentum = _momentum(default_symbol)
            momentum_note = (
                f" {default_symbol} leads its class today at {momentum:+.2f}%."
                if momentum
                else ""
            )
            return AIProposal(
                action="REBALANCE_BUY",
                symbol=default_symbol,
                confidence=min(0.95, 0.70 + abs(drift) * 0.02),
                rationale=(
                    f"{asset_class.replace('_', ' ').title()} is underweight by "
                    f"{abs(drift):.1f} percentage points. A measured addition to "
                    f"{default_symbol} would improve target alignment while retaining cash."
                    f"{momentum_note}"
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

    def _impact_for(self, action: str, drift: float, reason: str) -> tuple[float, float]:
        if action == "REBALANCE_SELL":
            # Concentration / cash-floor sells improve risk and free capital for growth.
            risk_delta = -round(
                min(
                    0.6,
                    abs(drift) * 0.025
                    + (0.15 if reason in {"concentration", "cash_floor"} else 0),
                ),
                2,
            )
            return_delta = round(
                0.02 if reason in {"concentration", "cash_floor"} else -abs(drift) * 0.01,
                2,
            )
            return risk_delta, return_delta
        if action == "REBALANCE_BUY":
            return (
                round(min(0.3, abs(drift) * 0.015), 2),
                round(abs(drift) * 0.015, 2),
            )
        return 0.0, 0.0

    def _suggest_quantity(
        self,
        state: dict,
        symbol: str | None,
        drift: float,
        action: str,
        reason: str = "drift",
    ) -> float | None:
        if not symbol:
            return None
        try:
            price = market_data.get_price(symbol)
        except ValueError:
            return None

        notional = state["total_value"] * (abs(drift) / 100) * 0.5
        if reason in {"concentration", "cash_floor"}:
            # Size sells to clear the breach, not a timid half-step.
            notional = state["total_value"] * (abs(drift) / 100) * 0.85

        if action == "REBALANCE_BUY":
            cash_floor = state["total_value"] * (MIN_CASH / 100)
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
            notional = min(notional, position_row["market_value"] * 0.95)

        if notional <= 0 or price <= 0:
            return None
        qty = notional / price
        if symbol in ("BTC", "ETH"):
            rounded = round(qty, 4)
        else:
            rounded = round(qty, 2)
        return rounded if rounded > 0 else None


ai_service = AIRecommendationService()
