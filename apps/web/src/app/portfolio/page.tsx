"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioView } from "@/components/observatory/PortfolioView";
import { PageBanner } from "@/components/ui/PageBanner";
import { api } from "@/lib/api";
import type { PortfolioData } from "@/lib/types";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api.getPortfolio().then(({ data: portfolio, error }) => {
      if (!portfolio) {
        setLoadError(error ?? "API unavailable");
        return;
      }
      setData(portfolio);
      setLoadError(null);
    });
  }, []);

  return (
    <AppShell title="Portfolio" variant="observatory">
      {data ? (
        <PortfolioView data={data} />
      ) : (
        <PageBanner kind="demo">{loadError ?? "Connecting to live portfolio API…"}</PageBanner>
      )}
    </AppShell>
  );
}
