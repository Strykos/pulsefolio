"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaperTradingBadgeProps {
  className?: string;
  compact?: boolean;
}

export function PaperTradingBadge({ className, compact = false }: PaperTradingBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-gain/30 bg-gain/10 font-semibold uppercase tracking-wider text-gain",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gain animate-pulsebeat" />
      {compact ? "Paper" : "Paper Trading"}
    </motion.span>
  );
}
