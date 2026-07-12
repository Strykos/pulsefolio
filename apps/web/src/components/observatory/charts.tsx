"use client";

import { Check } from "lucide-react";
import type { Position } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CHART_COLORS = ["#00D4AA", "#2F8FF0", "#8047D9", "#E7AE39"];
const CHART_PLOT_TOP = 3;
const CHART_PLOT_BOTTOM = 93;
const CHART_PLOT_HEIGHT = CHART_PLOT_BOTTOM - CHART_PLOT_TOP;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

export function ChartFrame({
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
        {[CHART_PLOT_TOP, 25, 47, 69, CHART_PLOT_BOTTOM].map((line) => (
          <line key={line} x1="0" x2="150" y1={line} y2={line} stroke="#27303B" strokeWidth=".6" />
        ))}
        {y !== undefined && <line x1="0" x2="150" y1={y} y2={y} stroke="#8D96A3" strokeWidth=".8" strokeDasharray="3 3" />}
        {children}
      </svg>
      <span className="absolute -top-0.5 left-0 text-[6px] text-obs-muted">{maxLabel}</span>
      <span className="absolute bottom-2 left-0 text-[6px] text-obs-muted">{minLabel}</span>
      {thresholdText && (
        <span className="absolute right-0 text-[6px] text-obs-muted" style={{ top: `${clamp(y ?? 0, 2, 88)}px` }}>
          {thresholdText}
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[6px] text-obs-muted">
        <span>Jul 1</span>
        <span>Jul 16</span>
        <span>Jul 31</span>
      </div>
    </div>
  );
}

export function EvidenceCard({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <section className="min-h-0 rounded-[8px] border border-obs-border bg-obs-card p-2.5">
      <h2 className="text-[10px] font-medium">{index}. {title}</h2>
      {children}
    </section>
  );
}

export function AllocationDriftChart({ positions }: { positions: Position[] }) {
  const visible = positions.slice(0, 4);
  return (
    <div className="mt-1">
      <ChartFrame maxLabel="20%" minLabel="-20%">
        {visible.map((position, index) => {
          const values = derivedSeries(position.changePercent, hash(position.symbol), 12);
          return (
            <polyline
              key={position.symbol}
              points={chartPoints(values, -20, 20)}
              fill="none"
              stroke={CHART_COLORS[index]}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          );
        })}
      </ChartFrame>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
        {visible.map((position, index) => (
          <span key={position.symbol} className="flex items-center justify-between text-[7px]">
            <span className="flex items-center gap-1 text-obs-muted">
              <i className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_COLORS[index] }} />
              {position.symbol}
            </span>
            <b className="font-medium" style={{ color: CHART_COLORS[index] }}>
              {position.changePercent > 0 ? "+" : ""}
              {position.changePercent.toFixed(1)}%
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}

export function CashFloorChart({ evidenceTrend, minimum = 4 }: { evidenceTrend: number; minimum?: number }) {
  const start = Math.max(evidenceTrend + 3.8, 9.5);
  const values = Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    return start + (evidenceTrend - start) * progress + Math.sin(index * 1.7) * 0.35;
  });
  return (
    <div className="mt-1">
      <ChartFrame maxLabel={`${Math.ceil(start)}%`} minLabel="0%" threshold={minimum} thresholdLabel="min" domainMax={start}>
        <defs>
          <linearGradient id="obs-cash-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#00D4AA" stopOpacity=".25" />
            <stop offset="1" stopColor="#00D4AA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${areaPath(values, 0, start)} L 150 ${CHART_PLOT_BOTTOM} L 0 ${CHART_PLOT_BOTTOM} Z`} fill="url(#obs-cash-area)" />
        <polyline points={chartPoints(values, 0, start)} fill="none" stroke="#00D4AA" strokeWidth="1.6" />
      </ChartFrame>
      <p className="mt-1.5 flex items-center justify-between text-[7px] text-obs-muted">
        <span className="flex items-center gap-1 text-obs-teal">
          <Check className="h-2.5 w-2.5" />
          Above minimum
        </span>
        <b className="font-medium text-obs-text">{evidenceTrend.toFixed(1)}%</b>
      </p>
    </div>
  );
}

export function ConcentrationChart({ current, maximum = 30 }: { current: number; maximum?: number }) {
  const values = Array.from({ length: 12 }, (_, index) =>
    clamp(current + Math.sin(index * 1.4) * 1.8 + Math.cos(index * .65) * 1.1, 0, 40),
  );
  return (
    <div className="mt-1">
      <ChartFrame maxLabel="40%" minLabel="0%" threshold={maximum} thresholdLabel="max" domainMax={40}>
        <defs>
          <linearGradient id="obs-concentration-area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#8047D9" stopOpacity=".42" />
            <stop offset="1" stopColor="#8047D9" stopOpacity=".03" />
          </linearGradient>
        </defs>
        <path d={`${areaPath(values, 0, 40)} L 150 ${CHART_PLOT_BOTTOM} L 0 ${CHART_PLOT_BOTTOM} Z`} fill="url(#obs-concentration-area)" />
        <polyline points={chartPoints(values, 0, 40)} fill="none" stroke="#9B64E9" strokeWidth="1.6" />
      </ChartFrame>
      <p className="mt-1.5 flex items-center justify-between text-[7px] text-obs-muted">
        <span className="flex items-center gap-1 text-obs-teal">
          <Check className="h-2.5 w-2.5" />
          Within guardrail
        </span>
        <b className="font-medium text-obs-text">{current.toFixed(1)}%</b>
      </p>
    </div>
  );
}

export function DriftBarChart({
  label,
  current,
  target,
  color = "#00D4AA",
}: {
  label: string;
  current: number;
  target: number;
  color?: string;
}) {
  const max = Math.max(40, current, target);
  const drift = current - target;
  return (
    <div className="rounded-[8px] border border-obs-border bg-obs-card p-2.5">
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-medium">{label}</span>
        <span className={cn("tabular-nums", Math.abs(drift) < 3 ? "text-obs-teal" : "text-obs-amber")}>
          {drift > 0 ? "+" : ""}
          {drift.toFixed(1)}%
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-[#1A2129]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(current / max) * 100}%`, background: color }} />
        <div
          className="absolute -top-0.5 h-3 w-px bg-obs-text"
          style={{ left: `${(target / max) * 100}%` }}
          title={`Target ${target}%`}
        />
      </div>
      <p className="mt-1.5 text-[7px] text-obs-muted">
        {current.toFixed(1)}% current · {target.toFixed(1)}% plan
      </p>
    </div>
  );
}
