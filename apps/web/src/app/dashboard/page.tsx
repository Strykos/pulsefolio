"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BriefingView } from "@/components/observatory/BriefingView";
import { PageBanner } from "@/components/ui/PageBanner";
import { api } from "@/lib/api";
import type { DashboardData, PortfolioData } from "@/lib/types";
import { useWebSocketContext } from "@/providers/WebSocketProvider";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { portfolioValue } = useWebSocketContext();

  const load = useCallback(async () => {
    const [dashboardResult, portfolioResult] = await Promise.all([
      api.getDashboard(),
      api.getPortfolio(),
    ]);
    if (!dashboardResult.data || !portfolioResult.data) {
      setLoadError(dashboardResult.error ?? portfolioResult.error ?? "API unavailable");
      return;
    }
    setData(dashboardResult.data);
    setPortfolio(portfolioResult.data);
    setLoadError(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data || !portfolio) {
    return (
      <AppShell title="Briefing" variant="observatory">
        <PageBanner kind="demo">
          {loadError ?? "Connecting to live portfolio API…"}
        </PageBanner>
      </AppShell>
    );
  }

  const totalValue = portfolioValue ?? data.portfolio.totalValue;

  const handleApprove = async () => {
    const recommendationId = data.recommendation?.id;
    if (!recommendationId) return;
    setIsWorking(true);
    setMessage(null);
    const result = await api.approveRecommendation(recommendationId);
    if (result.success) {
      setMessage(
        result.status === "pending"
          ? "Trade staged for your approval in Activity."
          : "Trade approved and reflected in your portfolio.",
      );
      await load();
    } else {
      setMessage(result.error ?? "The recommendation could not be approved.");
    }
    setIsWorking(false);
  };

  const handleRefresh = async () => {
    setIsWorking(true);
    setMessage("Reviewing allocation, risk, and current guardrails…");
    const result = await api.generateRecommendation();
    if (result.success) {
      await load();
      setMessage("Fresh analysis is ready.");
    } else {
      setMessage(result.error ?? "Fresh analysis is unavailable.");
    }
    setIsWorking(false);
  };

  return (
    <AppShell title="Briefing" variant="observatory">
      <BriefingView
        data={data}
        portfolio={portfolio}
        totalValue={totalValue}
        isWorking={isWorking}
        message={message}
        onApprove={handleApprove}
        onHoldAttempt={() =>
          setMessage(
            "AI recommends holding — no trade to approve. Run a fresh analysis to get a new recommendation.",
          )
        }
        onRefresh={handleRefresh}
      />
    </AppShell>
  );
}
