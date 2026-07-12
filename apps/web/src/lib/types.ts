export type AssetClass = "STOCK" | "ETF" | "CRYPTO" | "BOND" | "COMMODITY" | "CASH";

export interface Position {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  shares: number;
  price: number;
  value: number;
  changePercent: number;
}

export interface AssetAllocation {
  assetClass: AssetClass;
  currentPercent: number;
  targetPercent: number;
  positions: Position[];
}

export interface Trade {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  mode: "manual" | "auto";
  status: "pending" | "executed" | "dismissed";
  timestamp: string;
  pnl?: number;
}

export interface AIInsight {
  id: string;
  timestamp: string;
  action: "REBALANCE" | "HOLD" | "BUY" | "SELL";
  symbol?: string;
  confidence?: number;
  riskDelta?: number;
  returnDelta?: number;
  rationale: string;
  outcome: string;
}

export interface AIRecommendation {
  id?: string;
  action: "REBALANCE" | "REBALANCE_BUY" | "REBALANCE_SELL" | "HOLD" | "BUY" | "SELL";
  symbol: string;
  confidence: number;
  riskDelta: number;
  returnDelta: number;
  rationale: string;
  engine?: string;
  model?: string;
  guardrailStatus?: string;
  suggestedQuantity?: number;
  generatedAt?: string;
  analysisTimestamp?: string;
  analysisAgeSeconds?: number;
  latencyMs?: number;
  alerts?: RiskAlert[];
  guardrails?: string[];
  guardrailEvidence?: {
    promptVersion?: string;
    fallbackReason?: string | null;
    allowedActions?: string[];
    allowedSymbols?: string[];
  };
  evidenceCashTrend?: number;
}

export interface RiskAlert {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  currentValue?: number;
  threshold?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  riskScore: number;
  riskLabel: string;
  allocations: { label: string; percent: number; color: string }[];
  sparkline: number[];
  riskAlerts?: RiskAlert[];
  allocationDrift?: Record<string, number>;
}

export interface DashboardData {
  portfolio: PortfolioSummary;
  recommendation: AIRecommendation | null;
  pendingTrades: number;
}

export interface PortfolioData {
  riskScore: number;
  riskLabel: string;
  riskAlerts?: RiskAlert[];
  allocationDrift?: Record<string, number>;
  assetClasses: AssetAllocation[];
}

export interface SettingsData {
  mode: "manual" | "auto";
  riskProfile: "conservative" | "balanced" | "growth";
  motionIntensity: "full" | "reduced" | "off";
  soundEnabled: boolean;
}
