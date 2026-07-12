"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityView } from "@/components/observatory/ActivityView";
import { PageBanner } from "@/components/ui/PageBanner";
import { api } from "@/lib/api";
import type { Trade } from "@/lib/types";

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await api.getTrades();
    if (!data) {
      setLoadError(error ?? "API unavailable");
      return;
    }
    setTrades(data);
    setLoadError(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (tradeId: string) => {
    await api.approveTrade(tradeId);
    await load();
  };

  return (
    <AppShell title="Activity" variant="observatory">
      {trades ? (
        <ActivityView trades={trades} onApprove={handleApprove} />
      ) : (
        <PageBanner kind="demo">{loadError ?? "Connecting to live activity API…"}</PageBanner>
      )}
    </AppShell>
  );
}
