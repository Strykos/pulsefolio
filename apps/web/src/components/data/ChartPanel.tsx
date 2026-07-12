"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DonutChartProps {
  segments: { label: string; percent: number; color: string }[];
  size?: number;
  className?: string;
}

export function DonutChart({ segments, size = 140, className }: DonutChartProps) {
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <svg width={size} height={size} className={cn("", className)} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--color-chart-grid)"
        strokeWidth="16"
      />
      {segments.map((seg, i) => {
        const dash = (seg.percent / 100) * circumference;
        const circle = (
          <motion.circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
          />
        );
        offset += dash;
        return circle;
      })}
    </svg>
  );
}

interface SparklineProps {
  data: number[];
  className?: string;
  height?: number;
}

export function Sparkline({ data, className, height = 80 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 280;
  const padding = 4;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? "var(--color-gain)" : "var(--color-loss)";

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
        <filter id="sparkGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.polygon
        points={areaPoints}
        fill="url(#sparkGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#sparkGlow)"
        initial={{ pathLength: 0, opacity: 0.5 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.circle
        cx={width - padding}
        cy={padding + (1 - (data[data.length - 1] - min) / range) * (height - padding * 2)}
        r="4"
        fill={strokeColor}
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ delay: 1.2, duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
      />
    </svg>
  );
}
