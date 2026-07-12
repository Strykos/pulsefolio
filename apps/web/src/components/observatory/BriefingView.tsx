"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatedValue } from "@/components/data/AnimatedValue";
import { TrendChart } from "@/components/data/TrendChart";
import { ActionBar } from "@/components/observatory/ActionBar";
import { AllocationDonut, buildAllocationSlices } from "@/components/observatory/AllocationDonut";
import { EvidenceRail } from "@/components/observatory/EvidenceRail";
import { GuardrailRail } from "@/components/observatory/GuardrailRail";
import { MetricGaugeRow } from "@/components/observatory/MetricGauges";
import { ObservatoryGrid, ObservatoryShell } from "@/components/observatory/ObservatoryShell";
import type { AIRecommendation, DashboardData, PortfolioData } from "@/lib/types";
import { cn, formatPercent } from "@/lib/utils";

interface BriefingViewProps {
  data: DashboardData;
  portfolio: PortfolioData;
  totalValue: number;
  isWorking: boolean;
  message: string | null;
  onApprove: () => void;
  onHoldAttempt?: () => void;
  onRefresh: () => void;
}

export function BriefingView({
  data,
  portfolio,
  totalValue,
  isWorking,
  message,
  onApprove,
  onHoldAttempt,
  onRefresh,
}: BriefingViewProps) {
  const recommendation = data.recommendation;
  const isHold = recommendation?.action === "HOLD";
  const positions = portfolio.assetClasses.flatMap((group) => group.positions);
  const topAllocation = [...data.portfolio.allocations].sort((a, b) => b.percent - a.percent)[0];
  const cashPercent =
    data.portfolio.allocations.find((a) => a.label.toLowerCase().includes("cash"))?.percent ?? 10;
  const cashTrend = recommendation?.evidenceCashTrend ?? cashPercent;
  const isUp = data.portfolio.dayChangePercent >= 0;
  const action = recommendation?.action.includes("SELL") ? "Reduce" : "Add";
  const quantity = recommendation?.suggestedQuantity
    ? `${recommendation.suggestedQuantity.toLocaleString()} `
    : "";

  const actionItems = [
    {
      label: "View portfolio",
      sublabel: "X-ray holdings",
      icon: BriefcaseBusiness,
      href: "/portfolio",
    },
    {
      label: recommendation ? "Open visual review" : "Run analysis",
      sublabel: recommendation ? "Full decision review" : "Generate recommendation",
      icon: Sparkles,
      href: recommendation ? "/decision" : undefined,
      onClick: recommendation ? undefined : onRefresh,
      variant: "primary" as const,
      disabled: isWorking,
    },
    {
      label: "Activity",
      sublabel: data.pendingTrades > 0 ? `${data.pendingTrades} pending` : "Trade history",
      icon: ListChecks,
      href: "/trades",
    },
  ];

  return (
    <ObservatoryShell>
      <ObservatoryGrid
        left={
          <EvidenceRail
            positions={positions}
            cashTrend={cashTrend}
            topPositionPercent={topAllocation?.percent ?? 0}
          />
        }
        center={
          <div className="flex min-h-full flex-col">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:rgba(0,212,170,.24)] bg-[color:rgba(0,212,170,.07)] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-obs-teal">
                <ShieldCheck className="h-3 w-3" />
                Guardrails active
              </span>
              {recommendation?.analysisAgeSeconds !== undefined && (
                <span className="inline-flex items-center gap-1 text-[9px] text-obs-muted">
                  <Clock3 className="h-3 w-3" />
                  Updated {Math.max(1, Math.round((recommendation.analysisAgeSeconds ?? 0) / 60))}m ago
                </span>
              )}
            </div>

            <h2 className="text-balance text-[clamp(18px,2vw,28px)] font-medium leading-tight tracking-[-0.035em]">
              {recommendation?.action === "HOLD" || !recommendation ? (
                "Your portfolio is stable. No changes are needed today."
              ) : (
                <>
                  {action}&nbsp;
                  <span className="font-semibold text-obs-teal">
                    {quantity}
                    {recommendation.symbol}
                  </span>
                  &nbsp;to restore balance.
                </>
              )}
            </h2>

            <div className="relative mt-4 overflow-hidden rounded-[9px] border border-obs-border bg-obs-card p-3">
              <div className="pointer-events-none absolute inset-0 observatory-grid opacity-20" />
              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-obs-muted">
                    Portfolio value
                  </p>
                  <AnimatedValue
                    value={totalValue}
                    format="currency"
                    className="mt-1 block text-[clamp(22px,3vw,36px)] font-semibold tracking-[-0.04em]"
                  />
                  <p className={cn("mt-1 text-sm tabular-nums", isUp ? "text-obs-teal" : "text-loss")}>
                    {formatPercent(data.portfolio.dayChangePercent)} today
                  </p>
                </div>
                <p className="text-[9px] text-obs-muted">
                  {data.portfolio.riskLabel} · {data.portfolio.riskScore.toFixed(1)} risk
                </p>
              </div>
              <div className="relative mt-3">
                <TrendChart data={data.portfolio.sparkline} height={180} />
              </div>
            </div>

            {recommendation && recommendation.action !== "HOLD" && (
              <div className="mt-4 overflow-hidden rounded-[9px] border border-obs-border bg-obs-card">
                <MetricGaugeRow
                  riskScore={data.portfolio.riskScore}
                  riskDelta={recommendation.riskDelta}
                  returnDelta={recommendation.returnDelta}
                  confidence={recommendation.confidence}
                />
              </div>
            )}

            {message && (
              <p
                role="status"
                className="mt-3 rounded-md border border-obs-border bg-obs-raised px-3 py-2 text-[11px] text-obs-muted"
              >
                {message}
              </p>
            )}

            {recommendation && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/decision"
                  className="inline-flex items-center gap-2 rounded-[9px] border border-[color:rgba(0,212,170,.6)] bg-gradient-to-br from-[#18d8a5] to-[#08b98b] px-4 py-2 text-xs font-semibold text-[#06120e]"
                >
                  Open visual review
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (isHold) {
                      onHoldAttempt?.();
                      return;
                    }
                    onApprove();
                  }}
                  disabled={isWorking}
                  className="inline-flex items-center gap-2 rounded-[9px] border border-obs-border bg-obs-raised px-4 py-2 text-xs font-medium text-obs-text disabled:opacity-50"
                >
                  <Check className="h-4 w-4 text-obs-teal" />
                  {isHold ? "No trade to approve" : "Quick approve"}
                </button>
              </div>
            )}
          </div>
        }
        right={
          <div className="flex h-full flex-col gap-4">
            <GuardrailRail
              riskScore={data.portfolio.riskScore}
              cashPercent={cashPercent}
              topPositionPercent={topAllocation?.percent ?? 0}
            />
            <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">Allocation</p>
              <AllocationDonut
                title="Current"
                subtitle="Portfolio mix"
                totalValue={totalValue}
                slices={buildAllocationSlices(data.portfolio.allocations, totalValue)}
                size="sm"
              />
            </div>
          </div>
        }
      />

      <ActionBar items={actionItems} />
    </ObservatoryShell>
  );
}
