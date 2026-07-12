"use client";

import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import { AssetClassBadge } from "@/components/data/AssetClassBadge";
import { ActionBar } from "@/components/observatory/ActionBar";
import { AllocationDonut } from "@/components/observatory/AllocationDonut";
import { DriftBarChart, ConcentrationChart, EvidenceCard } from "@/components/observatory/charts";
import { ObservatoryEyebrow, ObservatoryGrid, ObservatoryShell } from "@/components/observatory/ObservatoryShell";
import { RiskGauge } from "@/components/observatory/MetricGauges";
import { PageBanner } from "@/components/ui/PageBanner";
import type { PortfolioData } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

const CLASS_COLORS: Record<string, string> = {
  STOCK: "#2F8FF0",
  ETF: "#00D4AA",
  CRYPTO: "#8047D9",
  BOND: "#E7AE39",
  COMMODITY: "#D45B8C",
  CASH: "#737B89",
};

interface PortfolioViewProps {
  data: PortfolioData;
}

export function PortfolioView({ data }: PortfolioViewProps) {
  const positions = data.assetClasses.flatMap((group) => group.positions);
  const investedValue = positions.reduce((sum, position) => sum + position.value, 0);
  const attention = [...data.assetClasses]
    .map((group) => ({ ...group, drift: group.currentPercent - group.targetPercent }))
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .filter((group) => Math.abs(group.drift) >= 2);

  const donutSlices = data.assetClasses.map((group) => ({
    label: group.assetClass,
    percent: group.currentPercent,
    value: (group.currentPercent / 100) * investedValue,
    color: CLASS_COLORS[group.assetClass] ?? "#737B89",
  }));

  const topPosition = positions.reduce(
    (max, position) => (position.value > max.value ? position : max),
    positions[0],
  );
  const topPercent = investedValue > 0 ? (topPosition.value / investedValue) * 100 : 0;

  return (
    <ObservatoryShell>
      <ObservatoryGrid
        left={
          <div className="flex h-full flex-col">
            <ObservatoryEyebrow>Drift signals</ObservatoryEyebrow>
            <div className="grid flex-1 gap-2 overflow-y-auto">
              {data.assetClasses.map((group) => (
                <DriftBarChart
                  key={group.assetClass}
                  label={group.assetClass}
                  current={group.currentPercent}
                  target={group.targetPercent}
                  color={CLASS_COLORS[group.assetClass]}
                />
              ))}
            </div>
          </div>
        }
        center={
          <div className="flex min-h-full flex-col">
            <h2 className="text-[clamp(17px,1.8vw,24px)] font-medium tracking-[-0.035em]">
              Portfolio X-Ray — current weight versus your plan
            </h2>
            <p className="mt-1 text-[10px] text-obs-muted">
              {positions.length} positions · {formatCurrency(investedValue)} tracked value
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
                <AllocationDonut
                  title="Current"
                  subtitle="Asset class mix"
                  totalValue={investedValue}
                  slices={donutSlices}
                  size="md"
                />
              </div>
              <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-obs-muted">
                  Target alignment
                </p>
                <div className="space-y-3">
                  {data.assetClasses.map((group) => {
                    const drift = group.currentPercent - group.targetPercent;
                    return (
                      <div key={group.assetClass}>
                        <div className="mb-1 flex items-center justify-between text-[9px]">
                          <AssetClassBadge assetClass={group.assetClass} className="scale-90" />
                          <span className={cn("tabular-nums", Math.abs(drift) < 3 ? "text-obs-teal" : "text-obs-amber")}>
                            {drift > 0 ? "+" : ""}
                            {drift.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-[#1A2129]">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${Math.min(100, group.currentPercent)}%`,
                              background: CLASS_COLORS[group.assetClass],
                            }}
                          />
                          <div
                            className="absolute -top-0.5 h-3 w-px bg-obs-text"
                            style={{ left: `${Math.min(100, group.targetPercent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[9px] border border-obs-border bg-obs-card">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr] gap-3 border-b border-obs-border px-4 py-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-obs-muted">
                <span>Asset</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Value</span>
                <span className="text-right">From cost</span>
              </div>
              <div className="max-h-[220px] divide-y divide-obs-border overflow-y-auto">
                {positions.map((position) => (
                  <div
                    key={position.symbol}
                    className="grid grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr] items-center gap-3 px-4 py-2.5 text-[10px]"
                  >
                    <div>
                      <p className="font-semibold">{position.symbol}</p>
                      <p className="text-[8px] text-obs-muted">{position.name}</p>
                    </div>
                    <p className="text-right tabular-nums">{position.shares.toLocaleString()}</p>
                    <p className="text-right font-medium tabular-nums">{formatCurrency(position.value)}</p>
                    <p
                      className={cn(
                        "text-right font-medium tabular-nums",
                        position.changePercent >= 0 ? "text-obs-teal" : "text-loss",
                      )}
                    >
                      {formatPercent(position.changePercent)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        right={
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-[9px] border border-obs-border bg-obs-card">
              <RiskGauge current={data.riskScore} proposed={data.riskScore} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MetricTile label="Positions" value={positions.length.toString()} />
              <MetricTile label="Risk" value={data.riskLabel} />
            </div>
            {attention.length > 0 && (
              <div className="flex-1 overflow-y-auto rounded-[9px] border border-obs-border bg-obs-card p-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">
                  Needs attention
                </p>
                <div className="mt-3 space-y-2">
                  {attention.map((group) => (
                    <div key={group.assetClass} className="rounded-[7px] border border-obs-border bg-obs-raised p-2">
                      <AssetClassBadge assetClass={group.assetClass} className="scale-90" />
                      <p className="mt-2 text-[9px] font-medium">
                        {Math.abs(group.drift).toFixed(1)}% {group.drift > 0 ? "above" : "below"} target
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard"
                  className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-semibold text-obs-teal"
                >
                  <Bot className="h-3 w-3" />
                  Ask the copilot
                </Link>
              </div>
            )}
            <EvidenceCard index="3" title="Concentration">
              <ConcentrationChart current={topPercent} />
            </EvidenceCard>
          </div>
        }
      />

      <ActionBar
        items={[
          { label: "Briefing", sublabel: "Today's decision", icon: ShieldCheck, href: "/dashboard" },
          {
            label: "Rebalance review",
            sublabel: "Guardrailed decision",
            icon: ArrowRight,
            href: "/decision",
            variant: "primary",
          },
          { label: "Activity", sublabel: "Trade history", icon: BriefcaseBusiness, href: "/trades" },
        ]}
      />
    </ObservatoryShell>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-obs-border bg-obs-card px-3 py-2.5">
      <p className="text-[8px] uppercase tracking-[0.12em] text-obs-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
