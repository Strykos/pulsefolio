# Database Schema

## Tables

### users
- id (PK), email (unique), hashed_password, created_at

### user_settings
- id, user_id (FK unique), auto_trade_enabled, risk_profile, updated_at

### portfolios
- id, user_id (FK), name, target_allocations (JSON), created_at, updated_at

### positions
- id, portfolio_id (FK), symbol, asset_class, quantity, avg_cost, updated_at
- UNIQUE(portfolio_id, symbol)

### cash_ledger
- id, portfolio_id (FK), amount, balance_after, description, reference_id, created_at

### trades
- id, portfolio_id (FK), symbol, asset_class, side, quantity, limit_price, executed_price
- status, mode, recommendation_id (FK nullable), realized_pnl, created_at, executed_at

### ai_recommendations
- id, portfolio_id (FK), action, symbol, confidence, risk_impact, expected_return_impact
- rationale, payload (JSON), status, created_at

### decision_logs (append-only)
- id, portfolio_id (FK), user_id (FK), event_type, payload (JSON), created_at

### refresh_tokens
- id, user_id (FK), token_hash, expires_at, revoked, created_at

## Indexes
- users.email
- portfolios.user_id
- trades.portfolio_id, status
- decision_logs.portfolio_id, created_at
