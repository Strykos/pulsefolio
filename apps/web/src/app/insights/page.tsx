"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { InsightsView } from "@/components/observatory/InsightsView";
import { PageBanner } from "@/components/ui/PageBanner";
import { api } from "@/lib/api";
import type { AIInsight } from "@/lib/types";

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api.getInsights().then(({ data, error }) => {
      if (!data) {
        setLoadError(error ?? "API unavailable");
        return;
      }
      setInsights(data);
      setLoadError(null);
    });
  }, []);

  return (
    <AppShell title="AI decisions" variant="observatory">
      {insights ? (
        <InsightsView insights={insights} />
      ) : (
        <PageBanner kind="demo">{loadError ?? "Connecting to live insights API…"}</PageBanner>
      )}
    </AppShell>
  );
}
