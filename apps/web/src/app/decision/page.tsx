"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PaperTradingBadge } from "@/components/brand/PaperTradingBadge";
import { LiveIndicator } from "@/components/chrome/LiveIndicator";
import { DecisionReview } from "@/components/trading/DecisionReview";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { DashboardData, PortfolioData } from "@/lib/types";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

export default function DecisionPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { status } = useWebSocketContext();

  const load = useCallback(async () => {
    const [dashboardResult, portfolioResult] = await Promise.all([
      api.getDashboard(),
      api.getPortfolio(),
    ]);

    setDashboard(dashboardResult.data);
    setPortfolio(portfolioResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async () => {
    const recommendationId = dashboard?.recommendation?.id;
    if (!recommendationId) return;
    setIsWorking(true);
    setMessage(null);
    const result = await api.approveRecommendation(recommendationId);
    if (result.success) {
      setMessage(
        result.status === "pending"
          ? "Paper trade staged. Review it in Activity before execution."
          : "Paper trade approved and reflected in your portfolio.",
      );
      await load();
    } else {
      setMessage(result.error ?? "The paper trade could not be staged.");
    }
    setIsWorking(false);
  };

  const handleDismiss = async () => {
    setIsWorking(true);
    setMessage(null);
    const result = await api.dismissRecommendation();
    if (result.success) {
      setMessage("Recommendation dismissed. No portfolio changes were made.");
      await load();
    } else {
      setMessage(result.error ?? "The recommendation could not be dismissed.");
    }
    setIsWorking(false);
  };

  return (
    <div className="min-h-screen bg-[#080C10] text-[#F2F4F5]">
      <header className="grid h-[58px] grid-cols-[1fr_auto_1fr] items-center border-b border-[#222A35] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo variant="wordmark" size="sm" />
          <span className="hidden text-[9px] font-medium uppercase tracking-[0.17em] text-[#89919E] md:block">
            AI wealth copilot
          </span>
        </div>
        <h1 className="flex items-center justify-center gap-2 truncate text-sm font-semibold sm:text-base">
          <span className="text-[#2F8FF0]">✦</span>
          AI Decision Review
        </h1>
        <div className="flex items-center justify-end gap-3">
          <LiveIndicator status={status} />
          <PaperTradingBadge compact className="hidden sm:inline-flex" />
        </div>
      </header>

      {loading ? (
        <main className="mx-auto flex min-h-[calc(100vh-58px)] max-w-lg flex-col items-center justify-center px-6 text-center">
          <div className="h-10 w-10 animate-pulse rounded-full border-2 border-[#00D4AA]/30 border-t-[#00D4AA]" />
          <p className="mt-5 text-sm text-[#89919E]">Loading decision review…</p>
        </main>
      ) : dashboard?.recommendation && portfolio ? (
        <DecisionReview
          portfolio={dashboard.portfolio}
          holdings={portfolio}
          recommendation={dashboard.recommendation}
          quantity={dashboard.recommendation.suggestedQuantity ?? 0}
          onApprove={handleApprove}
          onDismiss={handleDismiss}
          onHoldAttempt={() =>
            setMessage(
              "AI recommends holding — no trade to approve. Run a fresh analysis from the briefing when you want a new recommendation.",
            )
          }
          isWorking={isWorking}
          message={message}
        />
      ) : (
        <main className="mx-auto flex min-h-[calc(100vh-58px)] max-w-lg flex-col items-center justify-center px-6 text-center">
          <ShieldCheck className="h-10 w-10 text-[#00D4AA]" />
          <h2 className="mt-5 text-2xl font-semibold">No active decision to review</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Return to your briefing and run a fresh analysis when you want another recommendation.
          </p>
          <Button className="mt-6" onClick={() => (window.location.href = "/dashboard")}>
            Return to briefing
          </Button>
        </main>
      )}
    </div>
  );
}
