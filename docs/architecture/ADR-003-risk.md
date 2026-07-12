# ADR-003: Multi-Asset and Risk Model

## Status
Accepted

## Asset classes (v1)
STOCK, ETF, BOND, CRYPTO, COMMODITY, CASH

## Risk engine rules
- Max 25% single instrument
- Max 40% per asset class
- Min 5% cash reserve
- Max 15% crypto (configurable)
- Min 3 asset classes
- Risk score 1–10 from concentration + volatility estimate
- Risk profiles: conservative / balanced / growth

## AI objective
Optimize risk-adjusted return (Sharpe-like), not raw return.
Rebalance when asset class drifts > 5% from target.

## Consequences
- Market data adapters per asset class
- Worker schedules differ: equities market hours, crypto 24/7
