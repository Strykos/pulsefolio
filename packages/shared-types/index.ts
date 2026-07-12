export type AssetClass = "STOCK" | "ETF" | "BOND" | "CRYPTO" | "COMMODITY" | "CASH";

export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "pending" | "executed" | "dismissed";
export type TradeMode = "manual" | "auto";
export type RiskProfile = "conservative" | "balanced" | "growth";
export type ThemeId = "midnight" | "aurora" | "paper" | "terminal";

export interface AIRecommendation {
  action: string;
  symbol: string;
  assetClass?: AssetClass;
  quantity?: number;
  confidence: number;
  expectedReturnImpact?: number;
  riskImpact?: number;
  rationale: string;
  expiresAt?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  mode: TradeMode;
  status: TradeStatus;
  timestamp: string;
  pnl?: number;
}

export interface Position {
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  avgCost: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  weightPercent: number;
}
