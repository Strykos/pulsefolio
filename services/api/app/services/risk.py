from app.models import AssetClass, RiskProfile
from app.schemas import RiskAlert, RiskAssessment
from app.services.market_data import SYMBOL_META

CRYPTO_CAP = 15.0
MIN_CASH = 5.0
MAX_SINGLE_ASSET = 25.0

RISK_LABELS = {
    (1, 3): "Conservative",
    (4, 6): "Balanced",
    (7, 8): "Growth",
    (9, 10): "Aggressive",
}


def _label_for_score(score: float) -> str:
    for (low, high), label in RISK_LABELS.items():
        if low <= score <= high:
            return label
    return "Balanced"


def _classify_symbol(symbol: str) -> AssetClass:
    meta = SYMBOL_META.get(symbol.upper())
    return meta["asset_class"] if meta else AssetClass.STOCK


def compute_risk_assessment(
    portfolio_state: dict,
    target_allocations: dict[str, float],
    risk_profile: RiskProfile = RiskProfile.BALANCED,
) -> RiskAssessment:
    total = portfolio_state["total_value"]
    cash_pct = (portfolio_state["cash_balance"] / total * 100) if total else 100.0

    class_weights: dict[str, float] = {ac.value: 0.0 for ac in AssetClass}
    class_weights[AssetClass.CASH.value] = cash_pct

    alerts: list[RiskAlert] = []
    max_position_weight = 0.0
    max_position_symbol = ""

    for row in portfolio_state["positions"]:
        pos = row["position"]
        weight = row["weight_percent"]
        ac = pos.asset_class.value
        class_weights[ac] = class_weights.get(ac, 0.0) + weight
        if weight > max_position_weight:
            max_position_weight = weight
            max_position_symbol = pos.symbol

    crypto_pct = class_weights.get(AssetClass.CRYPTO.value, 0.0)

    if crypto_pct > CRYPTO_CAP:
        alerts.append(
            RiskAlert(
                code="CRYPTO_CAP",
                severity="warning",
                message=f"Crypto allocation {crypto_pct:.1f}% exceeds {CRYPTO_CAP}% cap",
                current_value=crypto_pct,
                threshold=CRYPTO_CAP,
            )
        )

    if cash_pct < MIN_CASH:
        alerts.append(
            RiskAlert(
                code="MIN_CASH",
                severity="warning",
                message=f"Cash {cash_pct:.1f}% below minimum {MIN_CASH}%",
                current_value=cash_pct,
                threshold=MIN_CASH,
            )
        )

    if max_position_weight > MAX_SINGLE_ASSET:
        alerts.append(
            RiskAlert(
                code="CONCENTRATION",
                severity="warning",
                message=(
                    f"{max_position_symbol} at {max_position_weight:.1f}% "
                    f"exceeds {MAX_SINGLE_ASSET}% single-asset limit"
                ),
                current_value=max_position_weight,
                threshold=MAX_SINGLE_ASSET,
            )
        )

    allocation_drift: dict[str, float] = {}
    for asset_class, target in target_allocations.items():
        actual = class_weights.get(asset_class, 0.0)
        drift = actual - target
        allocation_drift[asset_class] = round(drift, 2)
        if abs(drift) >= 5.0:
            alerts.append(
                RiskAlert(
                    code="ALLOCATION_DRIFT",
                    severity="info",
                    message=f"{asset_class} drifted {drift:+.1f}% from target {target:.1f}%",
                    current_value=actual,
                    threshold=target,
                )
            )

    score = 3.0
    score += crypto_pct * 0.15
    score += max(0.0, max_position_weight - 10) * 0.2
    score += max(0.0, 20 - cash_pct) * 0.05
    score += sum(abs(d) for d in allocation_drift.values()) * 0.03

    profile_adjust = {
        RiskProfile.CONSERVATIVE: -1.0,
        RiskProfile.BALANCED: 0.0,
        RiskProfile.GROWTH: 1.0,
    }
    score += profile_adjust[risk_profile]
    score = max(1.0, min(10.0, round(score, 1)))

    return RiskAssessment(
        score=score,
        label=_label_for_score(score),
        alerts=alerts,
        allocation_drift=allocation_drift,
    )
