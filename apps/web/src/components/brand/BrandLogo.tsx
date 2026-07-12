"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BrandLogoVariant = "mark" | "wordmark" | "full";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: 28, md: 36, lg: 48 };

export function BrandLogo({ variant = "wordmark", className, size = "md" }: BrandLogoProps) {
  const iconSize = sizes[size];

  const Mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="32" fill="currentColor" className="text-bg" />
      <line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <motion.path
        d="M8 32 L16 32 L20 24 L24 40 L28 20 L32 32 L36 28 L40 32 L48 32 L56 32"
        stroke="url(#pulseGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="pulseGrad" x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-gain)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
    </svg>
  );

  if (variant === "mark") {
    return <div className={cn("inline-flex", className)}>{Mark}</div>;
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {Mark}
      <div className="flex flex-col">
        <span
          className={cn(
            "font-semibold tracking-tight text-text-primary",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-xl",
          )}
          style={{ letterSpacing: "-0.02em" }}
        >
          Pulsefolio
        </span>
        {variant === "full" && (
          <span className="text-xs text-text-muted italic">
            Every beat of your portfolio, decoded.
          </span>
        )}
      </div>
    </div>
  );
}
