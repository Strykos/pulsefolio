"use client";

import { useId } from "react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  percent: number;
  value: number;
  color: string;
}

interface AllocationDonutProps {
  title: string;
  subtitle: string;
  totalValue: number;
  slices: DonutSlice[];
  highlightLabel?: string;
  size?: "sm" | "md" | "lg";
}

export function AllocationDonut({
  title,
  subtitle,
  totalValue,
  slices,
  highlightLabel,
  size = "md",
}: AllocationDonutProps) {
  const radius = 63;
  const circumference = 2 * Math.PI * radius;
  const glowId = useId().replace(/:/g, "");
  let offset = 0;

  const sizeClass =
    size === "sm"
      ? "w-[clamp(100px,14vw,160px)]"
      : size === "lg"
        ? "w-[clamp(155px,19vw,246px)]"
        : "w-[clamp(115px,15.9vw,200px)]";

  return (
    <div className="min-w-0 pt-1 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">{title}</p>
      <p className="mt-0.5 text-[9px] text-obs-muted">{subtitle}</p>
      <div className={cn("donut relative mx-auto mt-2 aspect-square", sizeClass, highlightLabel && "donut-highlighted")}>
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${title} allocation`}>
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
            const isHighlighted = highlightLabel === slice.label;
            const element = (
              <circle
                key={slice.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHighlighted ? 34 : 26}
                strokeDasharray={`${Math.max(0, length - 2)} ${circumference}`}
                strokeDashoffset={-offset}
                filter={isHighlighted ? `url(#donut-glow-${glowId})` : undefined}
              />
            );
            offset += length;
            return element;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[clamp(11px,1vw,16px)] font-medium tracking-[-0.025em]">{formatCurrency(totalValue)}</p>
          <p className="mt-1 text-[8px] text-obs-muted">Total value</p>
        </div>
      </div>
      <div className="legend mx-auto mt-1 max-w-[270px] space-y-1">
        {slices.map((slice) => (
          <div key={slice.label} className="grid grid-cols-[1fr_38px_64px] items-center gap-1 text-[9px]">
            <span className="flex min-w-0 items-center gap-1.5 text-left">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
              <span className="truncate">{slice.label}</span>
            </span>
            <span className="text-right text-obs-muted">{slice.percent.toFixed(1)}%</span>
            <span className="text-right text-obs-muted">{formatCurrency(slice.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildAllocationSlices(
  allocations: { label: string; percent: number; color: string }[],
  totalValue: number,
): DonutSlice[] {
  return allocations.map((allocation) => ({
    label: allocation.label,
    percent: allocation.percent,
    value: (allocation.percent / 100) * totalValue,
    color: allocation.color,
  }));
}
