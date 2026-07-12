"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useMotionValueEvent } from "framer-motion";
import { cn, formatCurrency } from "@/lib/utils";

interface AnimatedValueProps {
  value: number;
  className?: string;
  format?: "currency" | "number" | "percent";
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

function formatValue(
  v: number,
  format: AnimatedValueProps["format"],
  decimals: number,
): string {
  if (format === "currency") return formatCurrency(v);
  if (format === "percent") return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
  return v.toFixed(decimals);
}

export function AnimatedValue({
  value,
  className,
  format = "currency",
  decimals = 2,
  prefix,
  suffix,
}: AnimatedValueProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const [display, setDisplay] = useState(() => formatValue(value, format, decimals));
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<"gain" | "loss" | null>(null);

  useMotionValueEvent(spring, "change", (v) => {
    setDisplay(formatValue(v, format, decimals));
  });

  useEffect(() => {
    spring.set(value);
    if (value > prevRef.current) setFlash("gain");
    else if (value < prevRef.current) setFlash("loss");
    prevRef.current = value;
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [value, spring]);

  return (
    <motion.span
      className={cn(
        "tabular-nums font-semibold transition-colors duration-normal",
        flash === "gain" && "text-gain",
        flash === "loss" && "text-loss",
        className,
      )}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
