"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RiskScoreGaugeProps {
  score: number;
  label?: string;
  className?: string;
  size?: number;
  tremble?: boolean;
}

export function RiskScoreGauge({
  score,
  label,
  className,
  size = 160,
  tremble = false,
}: RiskScoreGaugeProps) {
  const clamped = Math.min(10, Math.max(1, score));
  const spring = useSpring(clamped, { stiffness: 60, damping: 15 });
  const rotation = useTransform(spring, [1, 10], [-80, 80]);

  useEffect(() => {
    spring.set(clamped);
  }, [clamped, spring]);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 16;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--color-chart-grid)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 10) * Math.PI * r} ${Math.PI * r}`}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-gain)" />
            <stop offset="50%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-loss)" />
          </linearGradient>
        </defs>
        <motion.g
          style={{ originX: `${cx}px`, originY: `${cy}px`, rotate: rotation }}
          animate={tremble ? { x: [0, -1, 1, -1, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r + 12}
            stroke="var(--color-text-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5" fill="var(--color-text-primary)" />
        </motion.g>
      </svg>
      <div className="mt-1 text-center">
        <span className="text-2xl font-bold tabular-nums">{clamped.toFixed(1)}</span>
        {label && <p className="text-sm text-text-muted">{label}</p>}
      </div>
    </div>
  );
}
