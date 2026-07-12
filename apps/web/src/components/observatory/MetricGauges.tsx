"use client";

import { Check, TrendingUp } from "lucide-react";
import { clamp } from "@/components/observatory/charts";
import { cn } from "@/lib/utils";

export function RiskGauge({ current, proposed }: { current: number; proposed: number }) {
  const angle = -90 + (clamp(proposed, 0, 10) / 10) * 180;
  const delta = proposed - current;
  const riskBadge = delta < 0 ? "Lower risk" : delta > 0 ? "Higher risk" : "Stable risk";
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-2 py-3">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-obs-muted">Risk score</p>
      <div className="relative mt-1 h-[93px] w-[132px]">
        <svg viewBox="0 0 140 82" className="h-full w-full" aria-label={`Risk moves from ${current.toFixed(1)} to ${proposed.toFixed(1)}`}>
          <defs>
            <linearGradient id="obs-risk-gradient">
              <stop stopColor="#00D4AA" />
              <stop offset=".5" stopColor="#E7D84A" />
              <stop offset=".76" stopColor="#F58A47" />
              <stop offset="1" stopColor="#E94B54" />
            </linearGradient>
          </defs>
          <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="#252D37" strokeWidth="8" strokeLinecap="round" />
          <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="url(#obs-risk-gradient)" strokeWidth="8" strokeLinecap="round" />
          <g transform={`rotate(${angle} 70 70)`}>
            <line x1="70" y1="70" x2="70" y2="28" stroke="#F2F4F5" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="70" cy="70" r="4" fill="#F2F4F5" />
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-1 text-center">
          <span>
            <b className="block text-[16px] font-medium">{current.toFixed(1)}</b>
            <small className="text-[7px] text-obs-muted">Current</small>
          </span>
          <span className="pb-2 text-obs-muted">→</span>
          <span>
            <b className="block text-[16px] font-medium text-obs-teal">{proposed.toFixed(1)}</b>
            <small className="text-[7px] text-obs-muted">Proposed</small>
          </span>
        </div>
      </div>
      <MetricBadge icon={<Check className="h-3 w-3" />}>{riskBadge}</MetricBadge>
    </div>
  );
}

export function CircularMetric({
  label,
  value,
  subvalue,
  progress,
  color,
  badge,
  icon,
}: {
  label: string;
  value: string;
  subvalue: string;
  progress: number;
  color: string;
  badge: string;
  icon: React.ReactNode;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-2 py-3">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-obs-muted">{label}</p>
      <div className="relative mt-1 h-[93px] w-[93px]">
        <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="48" cy="48" r={radius} fill="#0D141B" stroke="#202A34" strokeWidth="5" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeOpacity=".22"
            strokeWidth="10"
            strokeDasharray={`${(clamp(progress, 0, 100) / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${(clamp(progress, 0, 100) / 100) * circumference} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <b className="text-[17px] font-medium">{value}</b>
          {subvalue ? <small className="mt-1 text-[7px] text-obs-muted">{subvalue}</small> : null}
        </div>
      </div>
      {badge ? <MetricBadge icon={icon}>{badge}</MetricBadge> : null}
    </div>
  );
}

export function MetricBadge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="mt-2 inline-flex h-6 items-center gap-1 rounded-md border border-[color:rgba(0,212,170,.24)] bg-[color:rgba(0,212,170,.07)] px-2 text-[8px] text-obs-teal">
      {icon}
      {children}
    </span>
  );
}

export function MetricGaugeRow({
  riskScore,
  riskDelta,
  returnDelta,
  confidence,
}: {
  riskScore: number;
  riskDelta: number;
  returnDelta: number;
  confidence: number;
}) {
  const proposedRisk = clamp(riskScore + riskDelta, 1, 10);
  return (
    <div className="grid border-t border-obs-border sm:grid-cols-3">
      <RiskGauge current={riskScore} proposed={proposedRisk} />
      <CircularMetric
        label="Expected return"
        value={`${returnDelta >= 0 ? "+" : ""}${returnDelta.toFixed(1)}%`}
        subvalue="Change"
        progress={clamp(58 + returnDelta * 24, 5, 100)}
        color="#2F8FF0"
        badge="Improvement"
        icon={<TrendingUp className="h-3 w-3" />}
      />
      <CircularMetric
        label="Confidence"
        value={`${confidence}%`}
        subvalue={confidence >= 80 ? "High" : "Moderate"}
        progress={confidence}
        color="#00D4AA"
        badge={confidence >= 80 ? "High conviction" : "Guardrailed"}
        icon={<Check className="h-3 w-3" />}
      />
    </div>
  );
}
