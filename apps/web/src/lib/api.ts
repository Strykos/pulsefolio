import type {
  DashboardData,
  AIInsight,
  PortfolioData,
  SettingsData,
  Trade,
} from "./types";
import { getStoredToken } from "@/providers/AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface FetchResult<T> {
  data: T | null;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  status?: string;
  tradeId?: string;
}

function apiPrefix(): string {
  if (!getStoredToken()) {
    throw new ApiError("Not authenticated", 401);
  }
  return "/api/v1/me";
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getStoredToken();
  if (!token) {
    throw new ApiError("Not authenticated", 401);
  }
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function fetchJson<T>(path: string): Promise<FetchResult<T>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_BASE}${apiPrefix()}${path}`, {
      signal: controller.signal,
      headers: authHeaders(),
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new ApiError(`API error: ${res.status}`, res.status);
    }

    const data = (await res.json()) as T;
    return { data };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "API unavailable",
    };
  }
}

async function postAction(path: string, body?: unknown): Promise<ActionResult> {
  try {
    const res = await fetch(`${API_BASE}${apiPrefix()}${path}`, {
      method: "POST",
      headers: authHeaders(
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      ),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => null);
      const message =
        typeof detail === "object" && detail && "detail" in detail
          ? String((detail as { detail: unknown }).detail)
          : `Request failed (${res.status})`;
      throw new ApiError(message, res.status);
    }
    const result = (await res.json()) as { tradeId?: string; status?: string };
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export const api = {
  getDashboard: () => fetchJson<DashboardData>("/dashboard"),
  getPortfolio: () => fetchJson<PortfolioData>("/portfolio"),
  getTrades: () => fetchJson<Trade[]>("/trades"),
  getInsights: () => fetchJson<AIInsight[]>("/insights"),
  getSettings: () => fetchJson<SettingsData>("/settings"),

  async approveTrade(tradeId: string): Promise<ActionResult> {
    return postAction(`/trades/${tradeId}/approve`);
  },

  async approveRecommendation(recommendationId: string): Promise<ActionResult> {
    return postAction(`/recommendations/${recommendationId}/approve`);
  },

  async dismissRecommendation(): Promise<ActionResult> {
    return postAction("/recommendations/dismiss");
  },

  async generateRecommendation(): Promise<ActionResult> {
    return postAction("/recommendations/generate");
  },

  async updateSettings(partial: Partial<SettingsData>): Promise<ActionResult> {
    try {
      const res = await fetch(`${API_BASE}${apiPrefix()}/settings`, {
        method: "PATCH",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(partial),
      });
      if (!res.ok) throw new ApiError("Settings update failed", res.status);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Settings update failed",
      };
    }
  },
};

export { API_BASE };
