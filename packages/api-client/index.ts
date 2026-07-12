/**
 * Pulsefolio API client — TypeScript bindings aligned with OpenAPI v0.1
 */
export type { AssetClass, Trade, AIRecommendation } from "@pulsefolio/shared-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class PulsefolioClient {
  constructor(private baseUrl = API_BASE, private token?: string) {}

  private headers(): HeadersInit {
    const h: HeadersInit = { Accept: "application/json", "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async getDashboard() {
    const res = await fetch(`${this.baseUrl}/api/v1/dashboard`, { headers: this.headers() });
    return res.json();
  }

  async getPortfolio() {
    const res = await fetch(`${this.baseUrl}/api/v1/portfolio`, { headers: this.headers() });
    return res.json();
  }

  async getTrades() {
    const res = await fetch(`${this.baseUrl}/api/v1/trades`, { headers: this.headers() });
    return res.json();
  }

  async approveTrade(tradeId: string) {
    const res = await fetch(`${this.baseUrl}/api/v1/trades/${tradeId}/approve`, {
      method: "POST",
      headers: this.headers(),
    });
    return res.json();
  }
}
