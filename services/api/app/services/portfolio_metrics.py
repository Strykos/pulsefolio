from __future__ import annotations

from app.services.market_data import market_data_service


def _position_rows(state: dict) -> list[dict]:
    return state.get("positions", [])


def portfolio_value_at_prices(state: dict, prices: dict[str, float]) -> float:
    total = float(state.get("cash_balance") or 0.0)
    for row in _position_rows(state):
        symbol = row["position"].symbol.upper()
        total += row["position"].quantity * prices.get(symbol, row["market_price"] or row["position"].avg_cost)
    return total


def portfolio_sparkline(state: dict, points: int = 48) -> list[float]:
    rows = _position_rows(state)
    if not rows:
        return [round(state["total_value"], 2)] * points

    histories = {row["position"].symbol.upper(): market_data_service.get_history(row["position"].symbol) for row in rows}
    lengths = [len(values) for values in histories.values() if values]
    if not lengths:
        return [round(state["total_value"], 2)] * points
    min_len = min(lengths)
    if min_len < 2:
        return [round(state["total_value"], 2)] * points

    series: list[float] = []
    for index in range(min_len):
        prices = {symbol: values[index] for symbol, values in histories.items()}
        series.append(round(portfolio_value_at_prices(state, prices), 2))

    if len(series) >= points:
        return series[-points:]

    padded = [series[0]] * (points - len(series)) + series
    return padded[-points:]


def portfolio_day_change(state: dict) -> tuple[float, float]:
    rows = _position_rows(state)
    current = float(state["total_value"])
    previous_prices = {
        row["position"].symbol.upper(): market_data_service.get_previous_close(row["position"].symbol)
        for row in rows
    }
    previous_total = portfolio_value_at_prices(state, previous_prices)
    day_change = round(current - previous_total, 2)
    day_change_percent = round((day_change / previous_total) * 100, 2) if previous_total else 0.0
    return day_change, day_change_percent
