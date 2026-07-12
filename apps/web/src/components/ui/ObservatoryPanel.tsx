import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ObservatoryPanelProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export function ObservatoryPanel({
  children,
  className,
  glow = false,
  padding = "md",
}: ObservatoryPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-card-border bg-surface",
        glow && "shadow-[0_0_24px_var(--color-pulse-glow)]",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
