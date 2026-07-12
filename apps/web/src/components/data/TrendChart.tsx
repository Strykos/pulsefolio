"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";

export type TrendPeriod = "1D" | "1W" | "1M" | "3M";

interface TrendChartProps {
  data: number[];
  className?: string;
  height?: number;
}

const PERIODS: TrendPeriod[] = ["1D", "1W", "1M", "3M"];
const CHART_PAD = { top: 18, right: 58, bottom: 30, left: 10 };

const PERIOD_LABELS: Record<TrendPeriod, string[]> = {
  "1D": ["9a", "11a", "1p", "3p", "5p", "Now"],
  "1W": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Now"],
  "1M": ["W1", "W2", "W3", "W4", "Now"],
  "3M": ["Jan", "Feb", "Mar", "Now"],
};

function resample(data: number[], target: number): number[] {
  if (data.length === 0) return [];
  if (data.length === target) return data;
  const result: number[] = [];
  for (let i = 0; i < target; i++) {
    const t = (i / (target - 1)) * (data.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(data.length - 1, lo + 1);
    const frac = t - lo;
    result.push(data[lo] * (1 - frac) + data[hi] * frac);
  }
  return result;
}

function seriesForPeriod(data: number[], period: TrendPeriod): number[] {
  const counts: Record<TrendPeriod, number> = { "1D": 24, "1W": 28, "1M": 30, "3M": 36 };
  const count = counts[period];
  const expanded = resample(data, Math.max(data.length, count));
  return resample(expanded, count).map((v, i) => {
    const wiggle =
      period === "1D"
        ? Math.sin(i / 2.2) * v * 0.0015
        : period === "1W"
          ? Math.sin(i / 3.5) * v * 0.0025
          : period === "1M"
            ? Math.sin(i / 4) * v * 0.0035
            : Math.sin(i / 5) * v * 0.0045;
    return Math.round((v + wiggle) * 100) / 100;
  });
}

function chartPoints(
  data: number[],
  width: number,
  height: number,
  pad: { top: number; right: number; bottom: number; left: number },
) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  return data.map((value, i) => ({
    x: pad.left + (i / (data.length - 1)) * innerW,
    y: pad.top + (1 - (value - min) / range) * innerH,
    value,
    index: i,
  }));
}

function smoothLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function areaPath(line: string, points: { x: number; y: number }[], height: number, padBottom: number): string {
  if (!points.length) return "";
  const baseline = height - padBottom;
  return `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}

export function TrendChart({ data, className, height = 200 }: TrendChartProps) {
  const [period, setPeriod] = useState<TrendPeriod>("1M");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(() => seriesForPeriod(data, period), [data, period]);
  const width = 360;
  const pad = CHART_PAD;

  const points = useMemo(
    () => chartPoints(series, width, height, pad),
    [series, height, pad],
  );

  const min = Math.min(...series);
  const max = Math.max(...series);
  const open = series[0];
  const close = series[series.length - 1];
  const change = ((close - open) / open) * 100;
  const isUp = change >= 0;
  const strokeColor = isUp ? "var(--color-gain)" : "var(--color-loss)";
  const highIndex = series.indexOf(max);
  const lowIndex = series.indexOf(min);
  const activeIndex = hoverIndex ?? series.length - 1;
  const active = points[activeIndex];

  const linePath = smoothLinePath(points);
  const fillPath = areaPath(linePath, points, height, pad.bottom);
  const xLabels = PERIOD_LABELS[period];
  const yTicks = [max, (max + min) / 2, min];

  const openY =
    pad.top +
    (1 - (open - min) / (max - min || 1)) * (height - pad.top - pad.bottom);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-surface/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setHoverIndex(null);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                period === p
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-[11px] tabular-nums">
          <span className="text-text-muted">
            H <span className="font-semibold text-gain">{formatCompact(max)}</span>
          </span>
          <span className="text-text-muted">
            L <span className="font-semibold text-loss">{formatCompact(min)}</span>
          </span>
          <span className={cn("font-semibold", isUp ? "text-gain" : "text-loss")}>
            {formatPercent(change)}
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="55%" stopColor={strokeColor} stopOpacity="0.12" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
            <filter id="trendGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {yTicks.map((tick, i) => {
            const y =
              pad.top +
              (1 - (tick - min) / (max - min || 1)) * (height - pad.top - pad.bottom);
            return (
              <g key={tick}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="var(--color-chart-grid)"
                  strokeWidth="1"
                  strokeDasharray={i === 1 ? "4 4" : undefined}
                  opacity={0.7}
                />
                <text
                  x={width - pad.right + 6}
                  y={y + 4}
                  fill="var(--color-text-muted)"
                  fontSize="10"
                  className="tabular-nums"
                >
                  {formatCompact(tick)}
                </text>
              </g>
            );
          })}

          <line
            x1={pad.left}
            y1={openY}
            x2={width - pad.right}
            y2={openY}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
            strokeDasharray="5 4"
            opacity={0.45}
          />

          <motion.path
            d={fillPath}
            fill="url(#trendAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.75"
            strokeLinecap="round"
            filter="url(#trendGlow)"
            initial={{ pathLength: 0, opacity: 0.6 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />

          {points.map((p) => (
            <rect
              key={p.index}
              x={p.x - (width / series.length) / 2}
              y={pad.top}
              width={width / series.length}
              height={height - pad.top - pad.bottom}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(p.index)}
            />
          ))}

          {hoverIndex !== null && active && (
            <>
              <line
                x1={active.x}
                y1={pad.top}
                x2={active.x}
                y2={height - pad.bottom}
                stroke="var(--color-accent)"
                strokeWidth="1"
                opacity={0.6}
              />
              <circle cx={active.x} cy={active.y} r="5" fill={strokeColor} stroke="white" strokeWidth="2" />
              <g transform={`translate(${Math.min(active.x - 50, width - pad.right - 100)}, ${pad.top + 4})`}>
                <rect width="100" height="34" rx="6" fill="var(--color-surface-elevated)" opacity="0.95" />
                <text x="8" y="14" fill="var(--color-text-muted)" fontSize="9">
                  {xLabels[Math.min(xLabels.length - 1, Math.floor((activeIndex / (series.length - 1)) * (xLabels.length - 1)))]}
                </text>
                <text x="8" y="28" fill="var(--color-text-primary)" fontSize="11" fontWeight="600" className="tabular-nums">
                  {formatCurrency(active.value)}
                </text>
              </g>
            </>
          )}

          {highIndex !== lowIndex && (
            <>
              <circle cx={points[highIndex].x} cy={points[highIndex].y} r="3.5" fill="var(--color-gain)" />
              <circle cx={points[lowIndex].x} cy={points[lowIndex].y} r="3.5" fill="var(--color-loss)" />
            </>
          )}

          {hoverIndex === null && (
            <motion.circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="5"
              fill={strokeColor}
              stroke="white"
              strokeWidth="2"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
            />
          )}

          {xLabels.map((label, i) => {
            const x = pad.left + (i / (xLabels.length - 1)) * (width - pad.left - pad.right);
            return (
              <text
                key={label}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="10"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
