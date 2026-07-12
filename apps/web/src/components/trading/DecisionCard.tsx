"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ObservatoryPanel } from "@/components/ui/ObservatoryPanel";
import { cn } from "@/lib/utils";
import type { AIRecommendation } from "@/lib/types";

interface DecisionCardProps {
  recommendation: AIRecommendation;
  onApprove?: () => void;
  onDismiss?: () => void;
  onRefresh?: () => void;
  reviewHref?: string;
  isWorking?: boolean;
  message?: string | null;
  className?: string;
}

export function DecisionCard({
  recommendation,
  onApprove,
  onDismiss,
  onRefresh,
  reviewHref,
  isWorking = false,
  message,
  className,
}: DecisionCardProps) {
  const isHold = recommendation.action === "HOLD";
  const action = recommendation.action.includes("SELL") ? "Reduce" : "Add";
  const quantity = recommendation.suggestedQuantity
    ? `${recommendation.suggestedQuantity.toLocaleString()} shares of `
    : "";
  const guardrails = recommendation.guardrails ?? [
    "Action validated against portfolio policy",
    recommendation.guardrailEvidence?.allowedSymbols?.length
      ? `${recommendation.guardrailEvidence.allowedSymbols.length} eligible assets evaluated`
      : "Eligible assets checked",
    recommendation.alerts?.length
      ? `${recommendation.alerts.length} risk observation${recommendation.alerts.length === 1 ? "" : "s"} reviewed`
      : "No blocking risk alerts",
  ];
  const modelName =
    recommendation.model && recommendation.engine
      ? `${recommendation.engine} · ${recommendation.model}`
      : recommendation.model ?? recommendation.engine ?? "Rules engine";

  return (
    <ObservatoryPanel padding="lg" className={cn("overflow-hidden p-0", className)}>
      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <Sparkles className="h-3 w-3" />
              AI decision
            </Badge>
            <Badge tone="positive">
              <ShieldCheck className="h-3 w-3" />
              Guardrails passed
            </Badge>
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Recommended next step
          </p>
          <h3 className="mt-2 max-w-3xl text-balance text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
            {isHold
              ? "Keep the portfolio unchanged for now."
              : (
                <>
                  {action}&nbsp;
                  <span className="text-gain">{quantity}{recommendation.symbol}</span>
                  &nbsp;to move closer to your plan.
                </>
              )}
          </h3>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <ImpactStat label="Confidence" value={`${recommendation.confidence}%`} color="var(--color-gain)" />
            <ImpactStat
              label="Risk impact"
              value={`${recommendation.riskDelta > 0 ? "+" : ""}${recommendation.riskDelta.toFixed(1)}`}
              positive={recommendation.riskDelta <= 0}
              color="var(--color-accent-blue)"
            />
            <ImpactStat
              label="Return impact"
              value={`${recommendation.returnDelta > 0 ? "+" : ""}${recommendation.returnDelta.toFixed(1)}%`}
              positive={recommendation.returnDelta >= 0}
              color="var(--color-accent-purple)"
            />
          </div>

          {message && (
            <p role="status" className="mt-5 rounded-md border border-card-border bg-surface-elevated px-3 py-2 text-sm text-text-muted">
              {message}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            {!isHold && (
              reviewHref ? (
                <Link
                  href={reviewHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-gain/60 bg-gradient-to-br from-[#18d8a5] to-[#08b98b] px-5 text-sm font-semibold text-[#06120e] shadow-[0_0_22px_rgba(0,212,170,0.12)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gain/50"
                >
                  Open visual review
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Button onClick={onApprove} disabled={isWorking}>
                  Review and approve
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )
            )}
            <Button variant="secondary" onClick={onRefresh} disabled={isWorking}>
              <RefreshCw className={cn("h-4 w-4", isWorking && "animate-spin")} />
              Run fresh analysis
            </Button>
            <Button variant="quiet" onClick={onDismiss} disabled={isWorking}>
              Not now
            </Button>
          </div>
        </div>

        <aside className="border-t border-card-border bg-surface-elevated/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Cpu className="h-4 w-4 text-gain" />
            Decision evidence
          </div>

          <dl className="mt-6 space-y-4">
            <EvidenceRow label="Model" value={modelName} />
            <EvidenceRow label="Action" value={recommendation.action.replaceAll("_", " ")} />
            <EvidenceRow label="Asset" value={recommendation.symbol || "No trade"} />
            {recommendation.latencyMs !== undefined && (
              <EvidenceRow label="Analysis time" value={`${recommendation.latencyMs} ms`} />
            )}
          </dl>

          <div className="mt-8 border-t border-card-border pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Safety checks
            </p>
            <ul className="mt-4 space-y-3">
              {guardrails.map((guardrail) => (
                <li key={guardrail} className="flex items-start gap-2.5 text-sm text-text-muted">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gain/20 bg-gain/10 text-gain">
                    <Check className="h-3 w-3" />
                  </span>
                  {guardrail}
                </li>
              ))}
            </ul>
          </div>

          {recommendation.alerts?.[0] && (
            <div className="mt-8 border-t border-card-border pt-6">
              <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">Primary observation</p>
              <p className="mt-2 text-sm leading-6 text-text-primary">
                {recommendation.alerts[0].message}
              </p>
            </div>
          )}
        </aside>
      </div>
    </ObservatoryPanel>
  );
}

function ImpactStat({
  label,
  value,
  positive,
  color,
}: {
  label: string;
  value: string;
  positive?: boolean;
  color: string;
}) {
  return (
    <div className="rounded-[8px] border border-card-border bg-surface-elevated/50 p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-8 w-1 rounded-full"
          style={{ background: color }}
          aria-hidden="true"
        />
        <p
          className={cn(
            "text-lg font-semibold tabular-nums",
            positive === true && "text-gain",
            positive === false && "text-loss",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}
