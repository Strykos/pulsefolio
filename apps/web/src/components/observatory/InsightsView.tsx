"use client";

import Link from "next/link";
import { ArrowRight, Brain, ShieldCheck, Sparkles } from "lucide-react";
import { ActionBar } from "@/components/observatory/ActionBar";
import { CircularMetric } from "@/components/observatory/MetricGauges";
import { ObservatoryEyebrow, ObservatoryGrid, ObservatoryShell } from "@/components/observatory/ObservatoryShell";
import { PageBanner } from "@/components/ui/PageBanner";
import type { AIInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InsightsViewProps {
  insights: AIInsight[];
}

export function InsightsView({ insights }: InsightsViewProps) {
  const avgConfidence =
    insights.filter((i) => i.confidence).reduce((sum, i) => sum + (i.confidence ?? 0), 0) /
    Math.max(1, insights.filter((i) => i.confidence).length);
  const rebalanceCount = insights.filter((i) => i.action !== "HOLD").length;

  return (
    <ObservatoryShell>

      <ObservatoryGrid
        left={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Decision stats</ObservatoryEyebrow>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Total" value={insights.length.toString()} />
              <Stat label="Actions" value={rebalanceCount.toString()} accent />
            </div>
            <div className="rounded-[9px] border border-obs-border bg-obs-card">
              <CircularMetric
                label="Avg confidence"
                value={`${Math.round(avgConfidence)}%`}
                subvalue="Across history"
                progress={avgConfidence}
                color="#00D4AA"
                badge="Model track record"
                icon={<Brain className="h-3 w-3" />}
              />
            </div>
          </div>
        }
        center={
          <div className="flex min-h-full flex-col">
            <h2 className="text-[clamp(17px,1.8vw,24px)] font-medium tracking-[-0.035em]">
              AI decision history
            </h2>
            <p className="mt-1 text-[10px] text-obs-muted">
              {insights.length} prior recommendations with rationale and outcomes
            </p>
            <div className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        }
        right={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Latest outcome</ObservatoryEyebrow>
            {insights[0] && (
              <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
                <p className="text-[9px] text-obs-muted">
                  {new Date(insights[0].timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-2 text-[11px] font-medium leading-relaxed">{insights[0].outcome}</p>
                <Link href="/decision" className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-obs-teal">
                  Open current review
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        }
      />

      <ActionBar
        items={[
          { label: "Briefing", sublabel: "Today's decision", icon: ShieldCheck, href: "/dashboard" },
          { label: "Visual review", sublabel: "Current recommendation", icon: Sparkles, href: "/decision", variant: "primary" },
          { label: "Activity", sublabel: "Trade log", icon: ArrowRight, href: "/trades" },
        ]}
      />
    </ObservatoryShell>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const time = new Date(insight.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isHold = insight.action === "HOLD";

  return (
    <div className="overflow-hidden rounded-[9px] border border-obs-border bg-obs-card">
      <div className="grid sm:grid-cols-[1fr_auto]">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span className="text-obs-muted">{time}</span>
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]",
                isHold ? "bg-obs-raised text-obs-muted" : "bg-[color:rgba(0,212,170,.12)] text-obs-teal",
              )}
            >
              {insight.action}
            </span>
            {insight.symbol && <span className="font-semibold text-obs-teal">{insight.symbol}</span>}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-obs-muted">{insight.rationale}</p>
          <p className="mt-2 flex items-center gap-1 text-[9px] text-obs-teal">
            <ArrowRight className="h-3 w-3" />
            {insight.outcome}
          </p>
        </div>
        {insight.confidence !== undefined && (
          <div className="flex items-center border-t border-obs-border bg-obs-raised/50 p-3 sm:border-l sm:border-t-0">
            <CircularMetric
              label="Confidence"
              value={`${insight.confidence}%`}
              subvalue=""
              progress={insight.confidence}
              color="#2F8FF0"
              badge=""
              icon={<Brain className="h-3 w-3" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-[8px] border border-obs-border bg-obs-card px-3 py-2.5", accent && "border-[color:rgba(0,212,170,.3)]")}>
      <p className="text-[8px] uppercase tracking-[0.12em] text-obs-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
