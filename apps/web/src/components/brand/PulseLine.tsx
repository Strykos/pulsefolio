"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PulseLineProps {
  className?: string;
  intensity?: "normal" | "high";
}

export function PulseLine({ className, intensity = "normal" }: PulseLineProps) {
  const duration = intensity === "high" ? 1 : 2;

  return (
    <div className={cn("relative h-8 w-full overflow-hidden", className)}>
      <svg
        viewBox="0 0 400 32"
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <line
          x1="0"
          y1="16"
          x2="400"
          y2="16"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-chart-grid"
        />
        <motion.path
          d="M0 16 L40 16 L55 8 L70 24 L85 4 L100 16 L115 12 L130 16 L160 16 L200 16 L240 16 L255 8 L270 24 L285 4 L300 16 L315 12 L330 16 L400 16"
          stroke="url(#pulseLineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{
            pathLength: [0, 1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            pathLength: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
            opacity: { duration, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ filter: "drop-shadow(0 0 6px var(--color-pulse-glow))" }}
        />
        <defs>
          <linearGradient id="pulseLineGrad" x1="0" y1="16" x2="400" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-gain)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
