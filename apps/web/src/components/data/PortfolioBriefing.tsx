"use client";

import { Clock3, ShieldCheck } from "lucide-react";
import { AnimatedValue } from "@/components/data/AnimatedValue";
import { Sparkline } from "@/components/data/Sparkline";
import { Badge } from "@/components/ui/Badge";
import { ObservatoryPanel } from "@/components/ui/ObservatoryPanel";
import type { AIRecommendation, PortfolioSummary } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

interface PortfolioBriefingProps {
  portfolio: PortfolioSummary;
  recommendation: AIRecommendation | null;
  totalValue: number;
}

export function PortfolioBriefing({
  portfolio,
  recommendation,
  totalValue,
}: PortfolioBriefingProps) {
  const topAllocation = [...portfolio.allocations].sort((a, b) => b.percent - a.percent)[0];
  const recommendationVerb =
    recommendation?.action === "HOLD"
      ? "No changes are needed today."
      : recommendation
        ? "One adjustment can improve your balance."
        : "Your portfolio is within its current plan.";
  const ageSeconds = recommendation?.analysisAgeSeconds;
  const freshness =
    ageSeconds === undefined
      ? "Analysis freshness unavailable"
      : ageSeconds < 60
        ? "Analysis updated just now"
        : `Analysis updated ${Math.max(1, Math.round(ageSeconds / 60))}m ago`;
  const isUp = portfolio.dayChangePercent >= 0;

  return (
    <ObservatoryPanel glow padding="lg" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(0,212,170,0.12)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge tone="positive">
              <ShieldCheck className="h-3 w-3" />
              Guardrails active
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
              <Clock3 className="h-3.5 w-3.5" />
              {freshness}
            </span>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
            Your morning briefing
          </p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-text-primary sm:text-4xl lg:text-[2.75rem]">
            Your portfolio is stable. {recommendationVerb}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
            Pulsefolio reviewed allocation drift, concentration, cash floor, and risk posture
            before preparing this briefing.
          </p>
        </div>

        <div className="grid gap-6 border-t border-card-border pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Portfolio value
            </p>
            <AnimatedValue
              value={totalValue}
              format="currency"
              className="mt-1 block text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
            />
            <p className={isUp ? "mt-2 text-sm text-gain" : "mt-2 text-sm text-loss"}>
              {formatPercent(portfolio.dayChangePercent)} today
            </p>
            <div className="mt-4 h-12">
              <Sparkline data={portfolio.sparkline} color={isUp ? "var(--color-gain)" : "var(--color-loss)"} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <BriefMetric label="Risk posture" value={`${portfolio.riskScore.toFixed(1)} · ${portfolio.riskLabel}`} />
            <BriefMetric
              label="Largest exposure"
              value={topAllocation ? `${topAllocation.label} · ${topAllocation.percent.toFixed(1)}%` : "Unavailable"}
            />
          </div>
        </div>
      </div>
    </ObservatoryPanel>
  );
}

function BriefMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-card-border bg-surface-elevated/60 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
