from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import (
    AssetClass,
    DecisionEventType,
    RecommendationStatus,
    RiskProfile,
    TradeMode,
    TradeSide,
    TradeStatus,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Auth ---


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(ORMModel):
    id: str
    email: str
    created_at: datetime


# --- Settings ---


class UserSettingsResponse(ORMModel):
    auto_trade_enabled: bool
    risk_profile: RiskProfile
    updated_at: datetime


class UserSettingsUpdate(BaseModel):
    auto_trade_enabled: bool | None = None
    risk_profile: RiskProfile | None = None


# --- Portfolio ---


class AllocationTarget(BaseModel):
    asset_class: AssetClass
    target_percent: float = Field(ge=0, le=100)


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    target_allocations: list[AllocationTarget] = Field(default_factory=list)


class PortfolioUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    target_allocations: list[AllocationTarget] | None = None


class PositionResponse(ORMModel):
    id: str
    symbol: str
    asset_class: AssetClass
    quantity: float
    avg_cost: float
    market_price: float | None = None
    market_value: float | None = None
    unrealized_pnl: float | None = None
    weight_percent: float | None = None


class PortfolioSummary(BaseModel):
    total_value: float
    cash_balance: float
    invested_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    risk_score: float
    risk_label: str


class PortfolioResponse(ORMModel):
    id: str
    name: str
    target_allocations: dict[str, float]
    created_at: datetime
    updated_at: datetime
    summary: PortfolioSummary | None = None
    positions: list[PositionResponse] = Field(default_factory=list)


class PortfolioListItem(ORMModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    summary: PortfolioSummary | None = None


# --- Market ---


class PriceQuote(BaseModel):
    symbol: str
    asset_class: AssetClass
    price: float
    change_percent: float
    timestamp: datetime


class MarketPricesResponse(BaseModel):
    prices: list[PriceQuote]


# --- Risk ---


class RiskAlert(BaseModel):
    code: str
    severity: str
    message: str
    current_value: float | None = None
    threshold: float | None = None


class RiskAssessment(BaseModel):
    score: float = Field(ge=1, le=10)
    label: str
    alerts: list[RiskAlert] = Field(default_factory=list)
    allocation_drift: dict[str, float] = Field(default_factory=dict)


# --- Trades ---


class TradeCreate(BaseModel):
    portfolio_id: str
    symbol: str
    side: TradeSide
    quantity: float = Field(gt=0)
    limit_price: float | None = Field(default=None, gt=0)
    recommendation_id: str | None = None


class TradeResponse(ORMModel):
    id: str
    portfolio_id: str
    symbol: str
    asset_class: AssetClass
    side: TradeSide
    quantity: float
    limit_price: float | None
    executed_price: float | None
    status: TradeStatus
    mode: TradeMode
    recommendation_id: str | None
    realized_pnl: float | None
    created_at: datetime
    executed_at: datetime | None


# --- AI ---


class AIRecommendationResponse(ORMModel):
    id: str
    portfolio_id: str
    action: str
    symbol: str | None
    confidence: float
    risk_impact: float
    expected_return_impact: float
    rationale: str
    payload: dict[str, Any]
    status: RecommendationStatus
    created_at: datetime


class AIRecommendationRequest(BaseModel):
    portfolio_id: str


# --- Decision log ---


class DecisionLogResponse(ORMModel):
    id: str
    portfolio_id: str
    user_id: str
    event_type: DecisionEventType
    payload: dict[str, Any]
    created_at: datetime


# --- WebSocket ---


class StreamEvent(BaseModel):
    type: str
    data: dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Health ---


class HealthResponse(BaseModel):
    status: str
    version: str
