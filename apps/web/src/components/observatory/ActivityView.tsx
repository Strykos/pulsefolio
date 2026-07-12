"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Check, Clock, History, ShieldCheck } from "lucide-react";
import { Sparkline } from "@/components/data/Sparkline";
import { ActionBar } from "@/components/observatory/ActionBar";
import { CircularMetric } from "@/components/observatory/MetricGauges";
import { ObservatoryEyebrow, ObservatoryGrid, ObservatoryShell } from "@/components/observatory/ObservatoryShell";
import { PageBanner } from "@/components/ui/PageBanner";
import { TradeCelebration } from "@/components/trading/TradeCelebration";
import type { Trade } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

interface ActivityViewProps {
  trades: Trade[];
  onApprove: (tradeId: string) => void;
}

export function ActivityView({ trades, onApprove }: ActivityViewProps) {
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [celebrate, setCelebrate] = useState(false);

  const pending = trades.filter((t) => t.status === "pending");
  const history = trades.filter((t) => t.status !== "pending");
  const executed = trades.filter((t) => t.status === "executed");
  const totalPnl = executed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const volumeSeries = useMemo(
    () =>
      history
        .slice(0, 12)
        .reverse()
        .map((t, i) => t.price * t.quantity + i * 120),
    [history],
  );

  const handleApprove = (tradeId: string) => {
    onApprove(tradeId);
    setCelebrate(true);
  };

  const displayTrades = filter === "pending" ? pending : history;

  return (
    <ObservatoryShell>
      <TradeCelebration trigger={celebrate} onComplete={() => setCelebrate(false)} />

      <ObservatoryGrid
        left={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Activity pulse</ObservatoryEyebrow>
            <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
              <p className="text-[9px] text-obs-muted">Trade volume trend</p>
              <div className="mt-2 h-16">
                <Sparkline
                  data={volumeSeries.length >= 2 ? volumeSeries : [1000, 1200, 1100, 1400, 1300, 1500]}
                  color="var(--obs-teal)"
                  height={64}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Pending" value={pending.length.toString()} accent />
              <StatTile label="Executed" value={executed.length.toString()} />
              <StatTile label="Total" value={trades.length.toString()} />
              <StatTile
                label="P&L"
                value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`}
                positive={totalPnl >= 0}
              />
            </div>
          </div>
        }
        center={
          <div className="flex min-h-full flex-col">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-[clamp(17px,1.8vw,24px)] font-medium tracking-[-0.035em]">Trade activity</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "pending")}
                className="rounded-md border border-obs-border bg-obs-raised px-3 py-1.5 text-[10px] text-obs-text"
              >
                <option value="all">All trades</option>
                <option value="pending">Pending only</option>
              </select>
              {pending.length > 0 && (
                <span className="rounded-full border border-[color:rgba(0,212,170,.3)] bg-[color:rgba(0,212,170,.08)] px-2.5 py-1 text-[9px] font-semibold text-obs-teal">
                  {pending.length} awaiting approval
                </span>
              )}
            </div>

            {pending.length > 0 && filter === "all" && (
              <section className="mb-4">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">
                  Pending approvals
                </p>
                <div className="space-y-2">
                  {pending.map((trade) => (
                    <TradeCard key={trade.id} trade={trade} onApprove={() => handleApprove(trade.id)} glow />
                  ))}
                </div>
              </section>
            )}

            <section className="flex-1">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">History</p>
              <div className="max-h-[340px] space-y-2 overflow-y-auto">
                <AnimatePresence>
                  {displayTrades.length === 0 ? (
                    <p className="py-8 text-center text-[10px] text-obs-muted">No trades in this view.</p>
                  ) : (
                    displayTrades.map((trade) => <TradeCard key={trade.id} trade={trade} />)
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        }
        right={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Summary</ObservatoryEyebrow>
            <div className="rounded-[9px] border border-obs-border bg-obs-card">
              <CircularMetric
                label="Approval rate"
                value={`${trades.length > 0 ? Math.round((executed.length / trades.length) * 100) : 0}%`}
                subvalue="Executed"
                progress={trades.length > 0 ? (executed.length / trades.length) * 100 : 0}
                color="#00D4AA"
                badge="Paper mode"
                icon={<Check className="h-3 w-3" />}
              />
            </div>
            <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-obs-muted">Mode split</p>
              <div className="mt-3 space-y-2">
                <ModeRow label="Auto" count={trades.filter((t) => t.mode === "auto").length} total={trades.length} color="#2F8FF0" />
                <ModeRow label="Manual" count={trades.filter((t) => t.mode === "manual").length} total={trades.length} color="#00D4AA" />
              </div>
            </div>
          </div>
        }
      />

      <ActionBar
        items={[
          { label: "Briefing", sublabel: "Today's decision", icon: ShieldCheck, href: "/dashboard" },
          { label: "Decision review", sublabel: "Visual analysis", icon: Activity, href: "/decision", variant: "primary" },
          { label: "Portfolio", sublabel: "X-ray holdings", icon: History, href: "/portfolio" },
        ]}
      />
    </ObservatoryShell>
  );
}

function TradeCard({
  trade,
  onApprove,
  glow,
}: {
  trade: Trade;
  onApprove?: () => void;
  glow?: boolean;
}) {
  const date = new Date(trade.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.div initial={glow ? { x: -12, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }}>
      <div
        className={cn(
          "flex items-center justify-between rounded-[9px] border bg-obs-card px-4 py-3",
          glow ? "border-[color:rgba(0,212,170,.4)] shadow-[0_0_20px_rgba(0,212,170,0.1)]" : "border-obs-border",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]",
              trade.side === "BUY" ? "bg-obs-teal text-obs-teal" : "bg-loss text-loss",
            )}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {trade.side} {trade.symbol}
              </span>
              <span className="text-[10px] text-obs-muted">x{trade.quantity}</span>
              <span className="rounded-sm border border-obs-border bg-obs-raised px-1.5 py-0.5 text-[8px] uppercase text-obs-muted">
                {trade.mode}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[9px] text-obs-muted">
              <Clock className="h-3 w-3" />
              {date}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {trade.pnl !== undefined && (
            <span className={cn("text-sm font-medium tabular-nums", trade.pnl >= 0 ? "text-obs-teal" : "text-loss")}>
              {trade.pnl >= 0 ? "+" : ""}
              {formatCurrency(trade.pnl)}
            </span>
          )}
          {trade.status === "pending" && onApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="rounded-[8px] border border-[color:rgba(0,212,170,.6)] bg-gradient-to-br from-[#18d8a5] to-[#08b98b] px-3 py-1.5 text-[10px] font-semibold text-[#06120e]"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  accent,
  positive,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <div className={cn("rounded-[8px] border border-obs-border bg-obs-card px-3 py-2.5", accent && "border-[color:rgba(0,212,170,.3)]")}>
      <p className="text-[8px] uppercase tracking-[0.12em] text-obs-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold tabular-nums",
          positive === true && "text-obs-teal",
          positive === false && "text-loss",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ModeRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[9px]">
        <span className="text-obs-muted">{label}</span>
        <span className="font-medium tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1A2129]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
