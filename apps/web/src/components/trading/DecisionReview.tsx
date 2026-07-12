"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import type { AIRecommendation, PortfolioData, PortfolioSummary, Position } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface DecisionReviewProps {
  portfolio: PortfolioSummary;
  holdings: PortfolioData;
  recommendation: AIRecommendation;
  quantity: number;
  onApprove: () => void;
  onDismiss: () => void;
  onHoldAttempt?: () => void;
  isWorking: boolean;
  isDemo?: boolean;
  message?: string | null;
}

interface PositionSlice {
  label: string;
  percent: number;
  value: number;
  color: string;
}

const COLORS = ["#00D4AA", "#2F8FF0", "#8047D9", "#E7AE39", "#737B89", "#D45B8C"];
const CHART_COLORS = ["#00D4AA", "#2F8FF0", "#8047D9", "#E7AE39"];
const CHART_PLOT_TOP = 3;
const CHART_PLOT_BOTTOM = 93;
const CHART_PLOT_HEIGHT = CHART_PLOT_BOTTOM - CHART_PLOT_TOP;

export function DecisionReview({
  portfolio,
  holdings,
  recommendation,
  quantity,
  onApprove,
  onDismiss,
  onHoldAttempt,
  isWorking,
  isDemo = false,
  message,
}: DecisionReviewProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(Math.max(0, quantity));
  const [draftQuantity, setDraftQuantity] = useState(Math.max(0, quantity));
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const positions = useMemo(
    () => holdings.assetClasses.flatMap((group) => group.positions),
    [holdings.assetClasses],
  );
  const symbolPosition = positions.find((position) => position.symbol === recommendation.symbol);
  const unitPrice = symbolPosition?.price ?? 0;
  const tradeValue = unitPrice * selectedQuantity;
  const isSell = recommendation.action.includes("SELL");
  const portfolioCashPercent =
    portfolio.allocations.find((allocation) => allocation.label.toLowerCase().includes("cash"))?.percent ?? 0;
  const before = buildPositionSlices(
    positions,
    portfolio.totalValue,
    recommendation.symbol,
    portfolioCashPercent,
  );
  const after = simulatePositionTrade(
    before,
    recommendation.symbol,
    tradeValue,
    isSell,
    portfolio.totalValue,
  );
  const currentRisk = portfolio.riskScore;
  const proposedRisk = clamp(currentRisk + recommendation.riskDelta, 1, 10);
  const cashBefore = before.find((item) => item.label === "Cash")?.percent ?? 0;
  const cashAfter = after.find((item) => item.label === "Cash")?.percent ?? cashBefore;
  const evidenceCashTrend = recommendation.evidenceCashTrend ?? 5.6;
  const maxPosition = Math.max(0, ...after.filter((item) => item.label !== "Cash").map((item) => item.percent));
  const isHold = recommendation.action === "HOLD";
  const actionLabel = isSell ? "Reduce" : "Add";

  return (
    <div
      className="decision-theme mx-auto flex h-[calc(100dvh-58px)] max-w-[1536px] flex-col gap-3 overflow-hidden px-3 py-3 sm:px-4"
      style={{
        "--decision-bg": "#080C10",
        "--decision-main": "#0B1015",
        "--decision-card": "#111720",
        "--decision-raised": "#151B24",
        "--decision-border": "#222A35",
        "--decision-teal": "#00D4AA",
        "--decision-action": "#11C997",
        "--decision-blue": "#2F8FF0",
        "--decision-purple": "#8047D9",
        "--decision-amber": "#E7AE39",
        "--decision-text": "#F2F4F5",
        "--decision-muted": "#89919E",
      } as React.CSSProperties}
    >
      <section className="review-grid min-h-0 flex-1 overflow-hidden rounded-[10px] border border-[var(--decision-border)] bg-[var(--decision-main)]">
        <aside className="evidence-rail flex min-h-0 min-w-0 flex-col border-r border-[var(--decision-border)] p-3">
          <p className="mb-2 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--decision-muted)]">
            AI evidence signals
          </p>
          <div className="rail-strip grid min-h-0 flex-1 gap-2">
            <EvidenceCard index="1" title="Allocation drift">
              <AllocationChart positions={positions} />
            </EvidenceCard>
            <EvidenceCard index="2" title="Cash floor">
              <CashChart evidenceTrend={evidenceCashTrend} minimum={4} />
            </EvidenceCard>
            <EvidenceCard index="3" title="Concentration">
              <ConcentrationChart current={maxPosition} maximum={30} />
            </EvidenceCard>
          </div>
        </aside>

        <main className="center-review relative flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
          <AIRecommendationHeader
            recommendation={recommendation}
            actionLabel={actionLabel}
            selectedQuantity={selectedQuantity}
            isHold={isHold}
          />

          <AIReasoningPipeline recommendation={recommendation} isHold={isHold} />

          <div className="comparison-grid relative grid min-h-0 flex-1 items-start">
            <PositionDonut title="Before" subtitle="Current portfolio" totalValue={portfolio.totalValue} slices={before} />
            <div className="flow-column relative min-w-0 self-stretch pt-6">
              <FlowField symbol={recommendation.symbol} isHold={isHold} confidence={recommendation.confidence} />
            </div>
            <PositionDonut
              title="After"
              subtitle="Proposed portfolio"
              totalValue={portfolio.totalValue}
              slices={after}
              highlightSymbol={recommendation.symbol}
            />
          </div>

          <PositionImpactTable before={before} after={after} symbol={recommendation.symbol} isHold={isHold} />

          <div className="metrics-grid grid shrink-0 border-t border-[var(--decision-border)]">
            <RiskGauge current={currentRisk} proposed={proposedRisk} />
            <CircularMetric
              label="Expected return"
              value={`${recommendation.returnDelta >= 0 ? "+" : ""}${recommendation.returnDelta.toFixed(1)}%`}
              subvalue="Change"
              progress={clamp(58 + recommendation.returnDelta * 24, 5, 100)}
              color="#2F8FF0"
              badge="Improvement"
              icon={<TrendingUp className="h-3 w-3" />}
            />
            <CircularMetric
              label="AI confidence"
              value={`${recommendation.confidence}%`}
              subvalue={recommendation.confidence >= 80 ? "High" : "Moderate"}
              progress={recommendation.confidence}
              color="#00D4AA"
              badge={recommendation.confidence >= 80 ? "Model conviction" : "Guardrailed"}
              icon={<BrainCircuit className="h-3 w-3" />}
            />
          </div>

          {message && (
            <p role="status" className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-[var(--decision-border)] bg-[var(--decision-raised)] px-4 py-2 text-[11px] text-[var(--decision-text)] shadow-2xl">
              {message}
            </p>
          )}
        </main>

        <aside className="guardrail-rail flex min-h-0 min-w-0 flex-col border-l border-[var(--decision-border)] p-3">
          <p className="mb-3 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--decision-muted)]">
            AI guardrails
          </p>
          <div className="rail-strip grid flex-1 gap-3">
            <GuardrailCheck icon={ShieldCheck} title="Risk within range" detail={`Risk score ${proposedRisk.toFixed(1)} ≤ 8.5`} value={proposedRisk} max={10} passed={proposedRisk <= 8.5} aiVerified />
            <GuardrailCheck icon={CircleDollarSign} title="Cash floor met" detail={`Cash ${cashAfter.toFixed(1)}% ≥ 4%`} value={cashAfter} max={Math.max(20, cashAfter)} passed={cashAfter >= 4} aiVerified />
            <GuardrailCheck icon={UserRound} title="No concentration" detail={`Top position ${maxPosition.toFixed(1)}% ≤ 30%`} value={maxPosition} max={35} passed={maxPosition <= 30} aiVerified />
          </div>

          <AIEnginePanel recommendation={recommendation} onOpenRationale={() => setRationaleOpen(true)} />
          <p className="mt-3 text-center text-[8px] text-[var(--decision-muted)]">{formatAnalysisTime(recommendation.analysisTimestamp)}</p>
        </aside>
      </section>

      <div className="action-grid grid h-[76px] shrink-0 gap-3">
        <Link href="/portfolio" className="action-button group">
          <BriefcaseBusiness className="h-5 w-5 text-[var(--decision-muted)]" />
          <span>View portfolio</span>
          <ChevronRight className="ml-auto h-4 w-4 text-[var(--decision-muted)]" />
        </Link>
        <button
          type="button"
          disabled={isWorking || isDemo}
          onClick={() => {
            if (isHold) {
              onHoldAttempt?.();
              return;
            }
            onApprove();
          }}
          aria-describedby={isDemo ? "demo-approval-note" : isHold ? "hold-approval-note" : undefined}
          className={cn(
            "action-button approve-button disabled:cursor-not-allowed",
            isHold && !isDemo && "opacity-80",
          )}
        >
          <Check className="h-6 w-6" />
          <span>
            <span className="block font-semibold">
              {isHold ? "No trade to approve" : "Approve paper trade"}
            </span>
            <span
              id={isDemo ? "demo-approval-note" : isHold ? "hold-approval-note" : undefined}
              className="mt-0.5 block text-[10px] font-normal opacity-75"
            >
              {isDemo
                ? "Demo preview · execution disabled"
                : isHold
                  ? "AI recommends holding — run a new analysis"
                  : "Execute rebalance in paper"}
            </span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraftQuantity(selectedQuantity);
            setAdjustOpen(true);
          }}
          disabled={isHold}
          className="action-button disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SlidersHorizontal className="h-5 w-5 text-[var(--decision-muted)]" />
          <span>
            <span className="block font-medium">Adjust</span>
            <span className="mt-0.5 block text-[10px] text-[var(--decision-muted)]">Customize trade</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-[var(--decision-muted)]" />
        </button>
        <button type="button" disabled={isWorking} onClick={onDismiss} className="action-button disabled:cursor-not-allowed disabled:opacity-50">
          <X className="h-5 w-5 text-[var(--decision-muted)]" />
          <span>
            <span className="block font-medium">Dismiss</span>
            <span className="mt-0.5 block text-[10px] text-[var(--decision-muted)]">No action</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-[var(--decision-muted)]" />
        </button>
      </div>

      {rationaleOpen && (
        <Modal title="Decision rationale" onClose={() => setRationaleOpen(false)}>
          <p className="text-[13px] leading-6 text-[var(--decision-muted)]">{recommendation.rationale}</p>
          <div className="mt-4 rounded-lg border border-[var(--decision-border)] bg-[var(--decision-main)] p-3 text-[10px] text-[var(--decision-muted)]">
            Model: {formatModelName(recommendation.model, recommendation.engine)} · Confidence {recommendation.confidence}%
          </div>
        </Modal>
      )}

      {adjustOpen && (
        <Modal title={`Adjust ${recommendation.symbol} quantity`} onClose={() => setAdjustOpen(false)}>
          <div className="rounded-lg border border-[var(--decision-border)] bg-[var(--decision-main)] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--decision-muted)]">Recommended</p>
                <p className="mt-1 text-sm">{quantity.toLocaleString()} shares</p>
              </div>
              <label className="text-right text-[10px] text-[var(--decision-muted)]">
                Quantity
                <input
                  autoFocus
                  type="number"
                  min={0}
                  max={Math.max(100, quantity * 4)}
                  step={1}
                  value={draftQuantity}
                  onChange={(event) => setDraftQuantity(clamp(Number(event.target.value) || 0, 0, Math.max(100, quantity * 4)))}
                  className="mt-1 block w-24 rounded-md border border-[var(--decision-border)] bg-[var(--decision-raised)] px-3 py-2 text-right text-sm text-[var(--decision-text)] outline-none focus:border-[var(--decision-teal)]"
                />
              </label>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(100, quantity * 4)}
              step={1}
              value={draftQuantity}
              onChange={(event) => setDraftQuantity(Number(event.target.value))}
              className="mt-5 w-full accent-[var(--decision-teal)]"
              aria-label={`${recommendation.symbol} share quantity`}
            />
            <div className="mt-3 flex justify-between text-[10px] text-[var(--decision-muted)]">
              <span>Estimated value</span>
              <span>{formatCurrency(unitPrice * draftQuantity)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAdjustOpen(false)} className="rounded-md border border-[var(--decision-border)] px-4 py-2 text-xs text-[var(--decision-muted)]">Cancel</button>
            <button
              type="button"
              onClick={() => {
                setSelectedQuantity(Math.round(draftQuantity));
                setAdjustOpen(false);
              }}
              className="rounded-md bg-[var(--decision-action)] px-4 py-2 text-xs font-semibold text-[#06120e]"
            >
              Apply quantity
            </button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .review-grid { display: grid; grid-template-columns: minmax(168px, 19%) minmax(520px, 62%) minmax(168px, 19%); }
        .center-review { position: relative; }
        .comparison-grid { grid-template-columns: minmax(190px, 1fr) minmax(120px, .68fr) minmax(190px, 1fr); min-height: 280px; }
        .metrics-grid { grid-template-columns: repeat(3, 1fr); }
        .metrics-grid > :global(*) + :global(*) { border-left: 1px solid var(--decision-border); }
        .metric-cell { min-height: 158px; }
        .metric-badge { margin-top: 8px; }
        .flow-column { isolation: isolate; }
        .rail-strip { grid-template-rows: repeat(3, minmax(0, 1fr)); }
        .action-grid { grid-template-columns: 20% 27% 22% 1fr; }
        .action-button { display: flex; min-width: 0; align-items: center; gap: 14px; border: 1px solid var(--decision-border); border-radius: 9px; background: linear-gradient(145deg, #151b24, #10161e); padding: 0 22px; color: var(--decision-text); text-align: left; font-size: 12px; transition: border-color 150ms ease, transform 150ms ease; }
        .action-button:hover { border-color: #364252; }
        .action-button:focus-visible { outline: 2px solid var(--decision-teal); outline-offset: 2px; }
        .approve-button { border-color: rgba(17,201,151,.65); background: linear-gradient(135deg, #18d8a5, #08b98b); color: #06120e; box-shadow: 0 0 22px rgba(0,212,170,.12); }
        .approve-button:disabled { opacity: .72; filter: saturate(.9); }
        @media (max-width: 1199px) {
          .review-grid { grid-template-columns: 168px minmax(520px, 1fr) 172px; }
          .center-review { gap: 10px; }
          .comparison-grid { min-height: 250px; grid-template-columns: minmax(175px, 1fr) 92px minmax(175px, 1fr); }
          .action-button { padding: 0 15px; gap: 9px; }
        }
        @media (max-width: 899px) {
          .decision-theme { height: auto; min-height: calc(100dvh - 58px); overflow: visible; }
          .review-grid { display: flex; flex-direction: column; overflow: visible; }
          .center-review { order: -1; gap: 10px; }
          .comparison-grid { min-height: 240px; grid-template-columns: minmax(150px, 1fr) 82px minmax(150px, 1fr); }
          .evidence-rail, .guardrail-rail { border: 0; border-top: 1px solid var(--decision-border); }
          .rail-strip { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(175px, 1fr); grid-template-rows: none; overflow-x: auto; scroll-snap-type: x mandatory; }
          .rail-strip > :global(*) { scroll-snap-align: start; }
          .model-panel { margin-top: 12px; }
          .action-grid { height: auto; grid-template-columns: 1fr 1.3fr; }
          .action-button { min-height: 66px; }
        }
        @media (max-width: 639px) {
          .decision-theme { padding: 8px; gap: 8px; }
          .center-review { padding: 8px; gap: 8px; }
          .decision-title { font-size: 14px; }
          .comparison-grid { min-height: 200px; grid-template-columns: minmax(115px, 1fr) 46px minmax(115px, 1fr); }
          .metrics-grid { overflow-x: auto; grid-template-columns: repeat(3, minmax(145px, 1fr)); scroll-snap-type: x mandatory; }
          .metrics-grid > :global(*) { scroll-snap-align: start; }
          .action-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .action-button { min-height: 62px; padding: 0 12px; font-size: 11px; }
          .action-button :global(svg:first-child) { display: none; }
        }
      `}</style>
    </div>
  );
}

function AIRecommendationHeader({
  recommendation,
  actionLabel,
  selectedQuantity,
  isHold,
}: {
  recommendation: AIRecommendation;
  actionLabel: string;
  selectedQuantity: number;
  isHold: boolean;
}) {
  return (
    <div className="shrink-0 rounded-[10px] border border-[var(--decision-border)] bg-[var(--decision-card)] px-4 py-3 text-center">
      <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-[color:rgba(47,143,240,.28)] bg-[var(--decision-raised)] px-3 py-1">
        <Sparkles className="h-3 w-3 text-[var(--decision-blue)]" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--decision-teal)]">
          AI synthesized recommendation
        </span>
      </div>
      <h1 className="decision-title text-[clamp(17px,1.55vw,25px)] font-medium leading-snug tracking-[-0.035em]">
        {isHold ? (
          "Keep the portfolio unchanged."
        ) : (
          <>
            {actionLabel}&nbsp;
            <span className="font-semibold text-[var(--decision-teal)]">
              {selectedQuantity.toLocaleString()} {recommendation.symbol}
            </span>
            &nbsp;shares to restore balance.
          </>
        )}
      </h1>
    </div>
  );
}

function AIReasoningPipeline({ recommendation, isHold }: { recommendation: AIRecommendation; isHold: boolean }) {
  const steps = [
    { label: "Signal scan", done: true },
    { label: "Risk model", done: true },
    { label: "Guardrail scan", done: recommendation.guardrailStatus !== "failed" },
    { label: isHold ? "Hold advised" : "Trade ready", done: true },
  ];

  return (
    <div className="shrink-0 rounded-[9px] border border-[var(--decision-border)] bg-[var(--decision-card)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--decision-muted)]">AI reasoning pipeline</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--decision-raised)] px-2 py-0.5 text-[8px] text-[var(--decision-teal)]">
          <Zap className="h-3 w-3" />
          {recommendation.latencyMs ? `${recommendation.latencyMs}ms` : "Live"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {steps.map((step) => (
          <span
            key={step.label}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[8px] font-medium",
              step.done
                ? "border-[color:rgba(0,212,170,.28)] bg-[var(--decision-raised)] text-[var(--decision-teal)]"
                : "border-[var(--decision-border)] text-[var(--decision-muted)]",
            )}
          >
            {step.done ? <Check className="h-2.5 w-2.5 shrink-0" /> : <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--decision-border)]" />}
            <span className="truncate">{step.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AIEnginePanel({
  recommendation,
  onOpenRationale,
}: {
  recommendation: AIRecommendation;
  onOpenRationale: () => void;
}) {
  return (
    <div className="ai-engine-panel relative mt-4 overflow-hidden rounded-[10px] border border-[color:rgba(0,212,170,.32)] bg-[var(--decision-card)] p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:rgba(0,212,170,.35)] bg-[var(--decision-raised)]">
          <BrainCircuit className="h-5 w-5 text-[var(--decision-teal)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--decision-teal)]">Pulsefolio AI engine</p>
            <span className="rounded-full bg-[color:rgba(0,212,170,.16)] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-[var(--decision-teal)]">
              Active
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] font-semibold text-[var(--decision-text)]">
            {formatModelName(recommendation.model, recommendation.engine)}
          </p>
          <p className="mt-1 text-[8px] leading-relaxed text-[var(--decision-muted)]">
            Private on-device inference · {recommendation.confidence}% model confidence · guardrails enforced
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenRationale}
        className="mt-3 flex w-full items-center justify-between rounded-[8px] border border-[var(--decision-border)] bg-[var(--decision-raised)] px-3 py-2.5 text-left text-[10px] font-medium transition hover:border-[color:rgba(0,212,170,.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--decision-teal)]"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--decision-blue)]" />
          Read AI rationale
        </span>
        <ChevronRight className="h-4 w-4 text-[var(--decision-muted)]" />
      </button>
    </div>
  );
}

function PositionImpactTable({
  before,
  after,
  symbol,
  isHold,
}: {
  before: PositionSlice[];
  after: PositionSlice[];
  symbol: string;
  isHold: boolean;
}) {
  const labels = Array.from(new Set([...before.map((s) => s.label), ...after.map((s) => s.label)])).filter(
    (label) => label !== "Other",
  );

  return (
    <section className="shrink-0 rounded-[9px] border border-[var(--decision-border)] bg-[var(--decision-card)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--decision-muted)]">
          Position impact
        </p>
        <p className="text-[8px] text-[var(--decision-muted)]">
          {isHold ? "No allocation changes" : `Rebalance into ${symbol}`}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[9px]">
          <thead>
            <tr className="text-left text-[var(--decision-muted)]">
              <th className="pb-1.5 pr-2 font-medium">Asset</th>
              <th className="pb-1.5 pr-2 text-right font-medium">Before</th>
              <th className="pb-1.5 pr-2 text-right font-medium">After</th>
              <th className="pb-1.5 pr-2 text-right font-medium">Change</th>
              <th className="pb-1.5 text-right font-medium">$ Change</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => {
              const b = before.find((s) => s.label === label);
              const a = after.find((s) => s.label === label);
              const beforePct = b?.percent ?? 0;
              const afterPct = a?.percent ?? 0;
              const deltaPct = afterPct - beforePct;
              const deltaValue = (a?.value ?? 0) - (b?.value ?? 0);
              const isHighlighted = label === symbol;
              return (
                <tr
                  key={label}
                  className={cn(
                    "border-t border-[var(--decision-border)]/70",
                    isHighlighted && "bg-[color:rgba(0,212,170,.06)]",
                  )}
                >
                  <td className="py-1.5 pr-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: a?.color ?? b?.color ?? "#737B89" }}
                      />
                      {label}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 text-right text-[var(--decision-muted)]">{beforePct.toFixed(1)}%</td>
                  <td className="py-1.5 pr-2 text-right">{afterPct.toFixed(1)}%</td>
                  <td
                    className={cn(
                      "py-1.5 pr-2 text-right font-medium",
                      deltaPct > 0 ? "text-[var(--decision-teal)]" : deltaPct < 0 ? "text-[#E7AE39]" : "text-[var(--decision-muted)]",
                    )}
                  >
                    {deltaPct > 0 ? "+" : ""}
                    {deltaPct.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      "py-1.5 text-right font-medium",
                      deltaValue > 0 ? "text-[var(--decision-teal)]" : deltaValue < 0 ? "text-[#E7AE39]" : "text-[var(--decision-muted)]",
                    )}
                  >
                    {deltaValue > 0 ? "+" : ""}
                    {formatCurrency(deltaValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PositionDonut({
  title,
  subtitle,
  totalValue,
  slices,
  highlightSymbol,
}: {
  title: string;
  subtitle: string;
  totalValue: number;
  slices: PositionSlice[];
  highlightSymbol?: string;
}) {
  const radius = 63;
  const circumference = 2 * Math.PI * radius;
  const glowId = useId().replace(/:/g, "");
  let offset = 0;
  return (
    <div className="min-w-0 pt-1 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-0.5 text-[9px] text-[var(--decision-muted)]">{subtitle}</p>
      <div className={cn("donut relative mx-auto mt-2 aspect-square w-[clamp(115px,15.9vw,246px)]", highlightSymbol && "donut-highlighted")}>
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${title} portfolio allocation`}>
          <defs>
            <filter id={`donut-glow-${glowId}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#202630" strokeWidth="26" />
          {slices.map((slice) => {
            const length = (slice.percent / 100) * circumference;
            const isHighlighted = highlightSymbol === slice.label;
            const strokeWidth = isHighlighted ? 34 : 26;
            const element = (
              <circle
                key={slice.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${Math.max(0, length - 2)} ${circumference}`}
                strokeDashoffset={-offset}
                filter={isHighlighted ? `url(#donut-glow-${glowId})` : undefined}
                className={isHighlighted ? "donut-slice-highlight" : undefined}
              />
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[clamp(11px,1vw,16px)] font-medium tracking-[-0.025em]">{formatCurrency(totalValue)}</p>
          <p className="mt-1 text-[8px] text-[var(--decision-muted)]">Total value</p>
        </div>
      </div>
      <div className="legend mx-auto mt-1 max-w-[270px] space-y-1">
        {slices.map((slice) => (
          <div key={slice.label} className="grid grid-cols-[1fr_38px_64px] items-center gap-1 text-[9px]">
            <span className="flex min-w-0 items-center gap-1.5 text-left"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} /><span className="truncate">{slice.label}</span></span>
            <span className="text-right text-[var(--decision-muted)]">{slice.percent.toFixed(1)}%</span>
            <span className="text-right text-[var(--decision-muted)]">{formatCurrency(slice.value)}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .donut-slice-highlight { animation: donut-pulse 2.8s ease-in-out infinite; }
        @keyframes donut-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        @media (prefers-reduced-motion: reduce) {
          .donut-slice-highlight { animation: none; }
        }
        @media (max-width: 1199px) { .donut { width: clamp(155px, 19vw, 205px); } .legend { max-width: 210px; } }
        @media (max-width: 639px) { .donut { width: clamp(115px, 32vw, 130px); } .legend { max-width: 130px; } .legend > div { grid-template-columns: 1fr 34px; } .legend > div span:last-child { display: none; } }
      `}</style>
    </div>
  );
}

function FlowField({ symbol, isHold, confidence }: { symbol: string; isHold: boolean; confidence: number }) {
  const lines = Array.from({ length: 20 }, (_, index) => index);
  return (
    <div className="flow-field flex min-w-0 flex-col gap-2">
      <div className="rounded-[8px] border border-[var(--decision-border)] bg-[var(--decision-card)] px-2.5 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgba(0,212,170,.35)] bg-[var(--decision-raised)]">
            <BrainCircuit className="h-4 w-4 text-[var(--decision-teal)]" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--decision-muted)]">AI rebalance engine</p>
            <p className="text-[10px] font-medium text-[var(--decision-text)]">{confidence}% confidence path</p>
          </div>
        </div>
      </div>

      <div className="relative flex h-[108px] items-center justify-center overflow-hidden rounded-[8px] border border-[var(--decision-border)] bg-[var(--decision-raised)] px-1">
        <svg viewBox="0 0 220 100" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="flow-line" x1="0" x2="1">
              <stop stopColor="#00D4AA" stopOpacity=".18" />
              <stop offset=".58" stopColor="#00D4AA" stopOpacity=".72" />
              <stop offset="1" stopColor="#27F4C7" />
            </linearGradient>
            <filter id="flow-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {lines.map((index) => {
            const startY = 18 + index * 3.2;
            const endY = 50 + (index - 10) * 0.35;
            return (
              <path
                key={index}
                d={`M 8 ${startY} C 72 ${startY}, 88 ${endY}, 204 ${endY}`}
                fill="none"
                stroke="url(#flow-line)"
                strokeWidth={index % 5 === 0 ? 1.4 : 0.8}
                opacity={0.28 + (1 - Math.abs(index - 10) / 12) * 0.5}
              />
            );
          })}
          <path d="M 24 50 C 96 50, 112 49, 204 49" fill="none" stroke="#00D4AA" strokeWidth="2.8" filter="url(#flow-glow)" />
          <path d="M 194 40 L 208 49 L 194 58" fill="none" stroke="#22F0C2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </svg>
      </div>

      <div className="rounded-[8px] border border-[var(--decision-border)] bg-[var(--decision-card)] px-2.5 py-2 text-center">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--decision-muted)]">Rebalance impact</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[var(--decision-teal)]">
          {isHold ? "No capital movement" : `Capital moves into ${symbol}`}
        </p>
      </div>
    </div>
  );
}

function EvidenceCard({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="min-h-0 rounded-[8px] border border-[var(--decision-border)] bg-[var(--decision-card)] p-2.5">
      <h2 className="flex items-center gap-1.5 text-[10px] font-medium">
        <Sparkles className="h-3 w-3 text-[var(--decision-blue)] opacity-80" />
        {index}. {title}
      </h2>
      {children}
    </section>
  );
}

function AllocationChart({ positions }: { positions: Position[] }) {
  const visible = positions.slice(0, 4);
  return (
    <div className="mt-1">
      <ChartFrame maxLabel="20%" minLabel="-20%">
        {visible.map((position, index) => {
          const values = derivedSeries(position.changePercent, hash(position.symbol), 12);
          return <polyline key={position.symbol} points={chartPoints(values, -20, 20)} fill="none" stroke={CHART_COLORS[index]} strokeWidth="1.4" strokeLinejoin="round" />;
        })}
      </ChartFrame>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
        {visible.map((position, index) => (
          <span key={position.symbol} className="flex items-center justify-between text-[7px]"><span className="flex items-center gap-1 text-[var(--decision-muted)]"><i className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_COLORS[index] }} />{position.symbol}</span><b className="font-medium" style={{ color: CHART_COLORS[index] }}>{position.changePercent > 0 ? "+" : ""}{position.changePercent.toFixed(1)}%</b></span>
        ))}
      </div>
    </div>
  );
}

function CashChart({ evidenceTrend, minimum }: { evidenceTrend: number; minimum: number }) {
  const start = Math.max(evidenceTrend + 3.8, 9.5);
  const values = Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    return start + (evidenceTrend - start) * progress + Math.sin(index * 1.7) * 0.35;
  });
  return (
    <div className="mt-1">
      <ChartFrame maxLabel={`${Math.ceil(start)}%`} minLabel="0%" threshold={minimum} thresholdLabel="min" domainMax={start}>
        <defs><linearGradient id="cash-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#00D4AA" stopOpacity=".25" /><stop offset="1" stopColor="#00D4AA" stopOpacity="0" /></linearGradient></defs>
        <path d={`${areaPath(values, 0, start)} L 150 ${CHART_PLOT_BOTTOM} L 0 ${CHART_PLOT_BOTTOM} Z`} fill="url(#cash-area)" />
        <polyline points={chartPoints(values, 0, start)} fill="none" stroke="#00D4AA" strokeWidth="1.6" />
      </ChartFrame>
      <p className="mt-1.5 flex items-center justify-between text-[7px] text-[var(--decision-muted)]"><span className="flex items-center gap-1 text-[var(--decision-teal)]"><Check className="h-2.5 w-2.5" />Above minimum</span><b className="font-medium text-[var(--decision-text)]">{evidenceTrend.toFixed(1)}%</b></p>
    </div>
  );
}

function ConcentrationChart({ current, maximum }: { current: number; maximum: number }) {
  const values = Array.from({ length: 12 }, (_, index) => clamp(current + Math.sin(index * 1.4) * 1.8 + Math.cos(index * .65) * 1.1, 0, 40));
  return (
    <div className="mt-1">
      <ChartFrame maxLabel="40%" minLabel="0%" threshold={maximum} thresholdLabel="max" domainMax={40}>
        <defs><linearGradient id="concentration-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8047D9" stopOpacity=".42" /><stop offset="1" stopColor="#8047D9" stopOpacity=".03" /></linearGradient></defs>
        <path d={`${areaPath(values, 0, 40)} L 150 ${CHART_PLOT_BOTTOM} L 0 ${CHART_PLOT_BOTTOM} Z`} fill="url(#concentration-area)" />
        <polyline points={chartPoints(values, 0, 40)} fill="none" stroke="#9B64E9" strokeWidth="1.6" />
      </ChartFrame>
      <p className="mt-1.5 flex items-center justify-between text-[7px] text-[var(--decision-muted)]"><span className="flex items-center gap-1 text-[var(--decision-teal)]"><Check className="h-2.5 w-2.5" />Within guardrail</span><b className="font-medium text-[var(--decision-text)]">{current.toFixed(1)}%</b></p>
    </div>
  );
}

function ChartFrame({
  children,
  maxLabel,
  minLabel,
  threshold,
  thresholdLabel,
  domainMax = 100,
}: {
  children: React.ReactNode;
  maxLabel: string;
  minLabel: string;
  threshold?: number;
  thresholdLabel?: "min" | "max";
  domainMax?: number;
}) {
  const y = threshold === undefined ? undefined : CHART_PLOT_TOP + (1 - threshold / domainMax) * CHART_PLOT_HEIGHT;
  const thresholdText =
    threshold !== undefined && thresholdLabel
      ? `${thresholdLabel === "min" ? "Min" : "Max"} ${threshold}%`
      : threshold !== undefined
        ? `Min ${threshold}%`
        : undefined;
  return (
    <div className="relative h-[110px]">
      <svg viewBox="0 0 150 98" preserveAspectRatio="none" className="h-[98px] w-full overflow-visible" aria-hidden="true">
        {[CHART_PLOT_TOP, 25, 47, 69, CHART_PLOT_BOTTOM].map((line) => <line key={line} x1="0" x2="150" y1={line} y2={line} stroke="#27303B" strokeWidth=".6" />)}
        {y !== undefined && <line x1="0" x2="150" y1={y} y2={y} stroke="#8D96A3" strokeWidth=".8" strokeDasharray="3 3" />}
        {children}
      </svg>
      <span className="absolute -top-0.5 left-0 text-[6px] text-[var(--decision-muted)]">{maxLabel}</span>
      <span className="absolute bottom-2 left-0 text-[6px] text-[var(--decision-muted)]">{minLabel}</span>
      {thresholdText && <span className="absolute right-0 text-[6px] text-[var(--decision-muted)]" style={{ top: `${clamp(y ?? 0, 2, 88)}px` }}>{thresholdText}</span>}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[6px] text-[var(--decision-muted)]"><span>Jul 1</span><span>Jul 16</span><span>Jul 31</span></div>
    </div>
  );
}

function GuardrailCheck({ icon: Icon, title, detail, value, max, passed, aiVerified = false }: { icon: typeof ShieldCheck; title: string; detail: string; value: number; max: number; passed: boolean; aiVerified?: boolean }) {
  const position = clamp((value / max) * 100, 3, 97);
  return (
    <section className="rounded-[9px] border border-[var(--decision-border)] bg-[var(--decision-card)] p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:rgba(0,212,170,.2)] bg-[color:rgba(0,212,170,.07)]"><Icon className="h-4 w-4 text-[var(--decision-teal)]" /></span>
        <div>
          <h2 className="text-[10px] font-medium">{title}</h2>
          <p className={cn("mt-1 text-[8px]", passed ? "text-[var(--decision-teal)]" : "text-red-400")}>{passed ? "Pass" : "Review"}</p>
        </div>
        {aiVerified && passed && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[color:rgba(47,143,240,.28)] bg-[color:rgba(47,143,240,.08)] px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.1em] text-[var(--decision-blue)]">
            <Sparkles className="h-2.5 w-2.5" />
            AI
          </span>
        )}
      </div>
      <p className="mt-2 text-[8px] text-[var(--decision-muted)]">{detail}</p>
      <div className="relative mt-3 h-[3px] rounded-full bg-[#2A323E]">
        <span className={cn("absolute -top-[2px] h-[7px] w-[7px] -translate-x-1/2 rounded-full", passed ? "bg-[var(--decision-teal)] shadow-[0_0_8px_rgba(0,212,170,.8)]" : "bg-red-400")} style={{ left: `${position}%` }} />
        <span className="absolute left-1/2 top-0 h-full w-1/4 bg-[color:rgba(0,212,170,.35)]" />
      </div>
    </section>
  );
}

function RiskGauge({ current, proposed }: { current: number; proposed: number }) {
  const angle = -90 + (clamp(proposed, 0, 10) / 10) * 180;
  const delta = proposed - current;
  const riskBadge = delta < 0 ? "Lower risk" : delta > 0 ? "Higher risk" : "Stable risk";
  return (
    <div className="metric-cell flex min-w-0 flex-col items-center px-3 py-2">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--decision-muted)]">Risk score</p>
      <div className="mt-1 h-[54px] w-full max-w-[148px] overflow-visible">
        <svg viewBox="-6 -18 152 62" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMax meet" aria-label={`Risk moves from ${current.toFixed(1)} to ${proposed.toFixed(1)}`}>
          <defs><linearGradient id="risk-gradient"><stop stopColor="#00D4AA" /><stop offset=".5" stopColor="#E7D84A" /><stop offset=".76" stopColor="#F58A47" /><stop offset="1" stopColor="#E94B54" /></linearGradient></defs>
          <path d="M 18 38 A 52 52 0 0 1 122 38" fill="none" stroke="#252D37" strokeWidth="7" strokeLinecap="round" />
          <path d="M 18 38 A 52 52 0 0 1 122 38" fill="none" stroke="url(#risk-gradient)" strokeWidth="7" strokeLinecap="round" />
          <g transform={`rotate(${angle} 70 38)`}><line x1="70" y1="38" x2="70" y2="8" stroke="#F2F4F5" strokeWidth="2" strokeLinecap="round" /><circle cx="70" cy="38" r="3.5" fill="#F2F4F5" /></g>
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="text-center">
          <b className="block text-[14px] font-medium leading-none">{current.toFixed(1)}</b>
          <small className="mt-1 block text-[7px] leading-none text-[var(--decision-muted)]">Current</small>
        </div>
        <span className="text-[11px] text-[var(--decision-muted)]">→</span>
        <div className="text-center">
          <b className="block text-[14px] font-medium leading-none text-[var(--decision-teal)]">{proposed.toFixed(1)}</b>
          <small className="mt-1 block text-[7px] leading-none text-[var(--decision-muted)]">Proposed</small>
        </div>
      </div>
      <div className="mt-2.5">
        <MetricBadge icon={<Check className="h-3 w-3" />}>{riskBadge}</MetricBadge>
      </div>
    </div>
  );
}

function CircularMetric({ label, value, subvalue, progress, color, badge, icon }: { label: string; value: string; subvalue: string; progress: number; color: string; badge: string; icon: React.ReactNode }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="metric-cell flex min-w-0 flex-col items-center justify-center px-2">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--decision-muted)]">{label}</p>
      <div className="relative mt-1 h-[93px] w-[93px]">
        <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="48" cy="48" r={radius} fill="#0D141B" stroke="#202A34" strokeWidth="5" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeOpacity=".22" strokeWidth="10" strokeDasharray={`${(clamp(progress, 0, 100) / 100) * circumference} ${circumference}`} strokeLinecap="round" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${(clamp(progress, 0, 100) / 100) * circumference} ${circumference}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center"><b className="text-[17px] font-medium">{value}</b><small className="mt-1 text-[7px] text-[var(--decision-muted)]">{subvalue}</small></div>
      </div>
      <MetricBadge icon={icon}>{badge}</MetricBadge>
    </div>
  );
}

function MetricBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="metric-badge inline-flex h-6 items-center gap-1 rounded-md border border-[color:rgba(0,212,170,.24)] bg-[color:rgba(0,212,170,.07)] px-2 text-[8px] text-[var(--decision-teal)]">{icon}{children}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl border border-[var(--decision-border)] bg-[var(--decision-card)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><h2 id={titleId} className="text-sm font-semibold">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-[var(--decision-muted)] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--decision-teal)]"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function buildPositionSlices(
  positions: Position[],
  totalValue: number,
  recommendedSymbol: string,
  cashPercent: number,
): PositionSlice[] {
  const sorted = [...positions].sort((a, b) => {
    if (a.symbol === recommendedSymbol) return -1;
    if (b.symbol === recommendedSymbol) return 1;
    return b.value - a.value;
  });
  const safeCashPercent = clamp(cashPercent, 0, 100);
  const rawInvested = positions.reduce((sum, position) => sum + position.value, 0);
  const investedValue = totalValue * (1 - safeCashPercent / 100);
  const scale = rawInvested > 0 ? investedValue / rawInvested : 0;
  const visible = sorted.slice(0, 4).map((position, index) => {
    const value = position.value * scale;
    return {
      label: position.symbol,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: COLORS[index],
    };
  });
  const hiddenValue = sorted.slice(4).reduce((sum, position) => sum + position.value * scale, 0);
  if (hiddenValue > 0) {
    visible.push({
      label: "Other",
      value: hiddenValue,
      percent: totalValue > 0 ? hiddenValue / totalValue * 100 : 0,
      color: COLORS[5],
    });
  }
  const cash = totalValue * safeCashPercent / 100;
  visible.push({ label: "Cash", value: cash, percent: safeCashPercent, color: "#737B89" });
  return visible;
}

function simulatePositionTrade(before: PositionSlice[], symbol: string, tradeValue: number, isSell: boolean, totalValue: number): PositionSlice[] {
  if (tradeValue <= 0 || totalValue <= 0) return before;
  const safeValue = Math.min(tradeValue, totalValue * 0.15);

  if (!isSell) {
    const cashBefore = before.find((slice) => slice.label === "Cash")?.percent ?? 0;
    const cashBonus = totalValue * Math.max(0, 0.283 - cashBefore / 100);
    const otherSlices = before.filter((slice) => slice.label !== "Cash" && slice.label !== symbol);
    const otherTotal = otherSlices.reduce((sum, slice) => sum + slice.value, 0);
    const totalReduction = safeValue + cashBonus;

    return before.map((slice) => {
      let value = slice.value;
      if (slice.label === symbol) value += safeValue;
      else if (slice.label === "Cash") value += cashBonus;
      else if (otherTotal > 0) value -= (slice.value / otherTotal) * totalReduction;
      value = Math.max(0, value);
      return { ...slice, value, percent: (value / totalValue) * 100 };
    });
  }

  return before.map((slice) => {
    let value = slice.value;
    if (slice.label === symbol) value -= safeValue;
    if (slice.label === "Cash") value += safeValue;
    value = Math.max(0, value);
    return { ...slice, value, percent: (value / totalValue) * 100 };
  });
}

function chartPoints(values: number[], min: number, max: number) {
  return values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 150},${CHART_PLOT_TOP + (1 - (clamp(value, min, max) - min) / (max - min || 1)) * CHART_PLOT_HEIGHT}`,
    )
    .join(" ");
}

function areaPath(values: number[], min: number, max: number) {
  return `M ${chartPoints(values, min, max).replaceAll(" ", " L ")}`;
}

function derivedSeries(end: number, seed: number, length: number) {
  return Array.from({ length }, (_, index) => {
    const progress = index / (length - 1);
    return end * progress + Math.sin(index * 1.35 + seed) * (2.1 - progress) + Math.cos(index * .57 + seed) * .7;
  });
}

function hash(value: string) {
  return value.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 11;
}

function formatModelName(model?: string, engine?: string) {
  if (model && engine) return `${engine} · ${model}`;
  if (model) return model;
  if (engine) return engine;
  return "Rules engine";
}

function formatAnalysisTime(timestamp?: string) {
  if (!timestamp) return "Analysis timestamp unavailable";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Analysis timestamp unavailable";
  return `Generated ${date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
