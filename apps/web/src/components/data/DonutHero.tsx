"use client";

import { motion } from "framer-motion";
import { AnimatedValue } from "@/components/data/AnimatedValue";
import { DonutChart } from "@/components/data/ChartPanel";
import { cn, formatPercent } from "@/lib/utils";

interface DonutHeroProps {
  totalValue: number;
  dayChangePercent: number;
  segments: { label: string; percent: number; color: string }[];
  className?: string;
}

export function DonutHero({
  totalValue,
  dayChangePercent,
  segments,
  className,
}: DonutHeroProps) {
  const isUp = dayChangePercent >= 0;

  return (
    <div className={cn("relative flex items-center justify-center py-4", className)}>
      <DonutChart segments={segments} size={200} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <AnimatedValue
          value={totalValue}
          className="text-3xl font-bold tracking-tight sm:text-4xl"
        />
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "mt-1 text-sm font-semibold tabular-nums",
            isUp ? "text-gain" : "text-loss",
          )}
        >
          {isUp ? "▲" : "▼"} {formatPercent(dayChangePercent)} today
        </motion.span>
      </div>
    </div>
  );
}
