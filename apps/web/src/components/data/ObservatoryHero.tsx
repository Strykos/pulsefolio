"use client";

import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Radio } from "lucide-react";
import { AnimatedValue } from "@/components/data/AnimatedValue";
import { TrendChart } from "@/components/data/TrendChart";
import { cn, formatPercent } from "@/lib/utils";

interface ObservatoryHeroProps {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  trend: number[];
  allocations: { label: string; percent: number; color: string }[];
}

export function ObservatoryHero({
  totalValue,
  dayChange,
  dayChangePercent,
  trend,
  allocations,
}: ObservatoryHeroProps) {
  const positive = dayChangePercent >= 0;

  return (
    <section className="relative isolate min-h-[640px] overflow-hidden rounded-[28px] border border-white/10 bg-surface/35 px-4 pb-5 pt-4 backdrop-blur-xl sm:px-7 sm:pb-7">
      <div className="pointer-events-none absolute inset-0 observatory-grid opacity-35" />
      <motion.div
        className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full border border-gain/20"
        animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-36 -top-28 h-96 w-96 rounded-full border border-accent/15"
        animate={{ rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
      />

      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
          <Radio className="h-3.5 w-3.5 text-gain" />
          Portfolio observatory
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gain/20 bg-gain/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gain">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
          Signal live
        </div>
      </header>

      <div className="relative mt-8 grid gap-8 lg:grid-cols-[1fr_260px] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Net portfolio value</p>
          <AnimatedValue
            value={totalValue}
            className="mt-2 block text-[clamp(2.7rem,8vw,5.8rem)] font-semibold leading-none tracking-[-0.065em]"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold",
                positive ? "bg-gain/12 text-gain" : "bg-loss/12 text-loss",
              )}
            >
              <ArrowUpRight className={cn("h-4 w-4", !positive && "rotate-90")} />
              {formatPercent(dayChangePercent)}
            </span>
            <span className="text-sm tabular-nums text-text-muted">
              {positive ? "+" : ""}${dayChange.toLocaleString("en-US", { maximumFractionDigits: 2 })} today
            </span>
          </div>
        </div>

        <AllocationOrbit allocations={allocations} />
      </div>

      <div className="relative mt-8 border-t border-white/[0.07] pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Value trajectory
            </span>
          </div>
          <span className="hidden text-[10px] uppercase tracking-wider text-text-muted sm:block">
            Hover to inspect signal
          </span>
        </div>
        <TrendChart data={trend} height={250} />
      </div>
    </section>
  );
}

function AllocationOrbit({
  allocations,
}: {
  allocations: { label: string; percent: number; color: string }[];
}) {
  const primary = allocations[0];
  const orbit = allocations.slice(0, 5);

  return (
    <div className="relative mx-auto h-56 w-56">
      <motion.div
        className="absolute inset-4 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {orbit.map((item, index) => {
          const angle = (index / orbit.length) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 48;
          const y = 50 + Math.sin(angle) * 48;
          return (
            <motion.div
              key={item.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.8, delay: index * 0.35, repeat: Infinity }}
            >
              <span
                className="block h-3 w-3 rounded-full border-2 border-bg"
                style={{ backgroundColor: item.color }}
              />
            </motion.div>
          );
        })}
      </motion.div>
      <div className="absolute inset-[52px] flex flex-col items-center justify-center rounded-full border border-accent/20 bg-bg/70 text-center backdrop-blur-xl">
        <span className="text-[10px] uppercase tracking-wider text-text-muted">Largest signal</span>
        <span className="mt-1 text-lg font-semibold">{primary?.label ?? "Portfolio"}</span>
        <span className="text-sm font-semibold text-accent">{primary?.percent ?? 0}%</span>
      </div>
      <div className="absolute inset-x-2 bottom-0 grid grid-cols-2 gap-x-4 gap-y-1">
        {allocations.slice(0, 4).map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate text-text-muted">{item.label}</span>
            <span className="ml-auto font-semibold tabular-nums">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
