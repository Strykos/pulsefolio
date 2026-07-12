import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  glass?: boolean;
  glow?: boolean;
}

export function Card({ children, className, elevated = false, glass = false, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        glass
          ? "border-card-border bg-surface/75 backdrop-blur-xl"
          : elevated
            ? "border-card-border bg-surface-elevated"
            : "border-card-border bg-surface",
        glow && "transition-colors duration-normal hover:border-accent/25",
        className,
      )}
    >
      {children}
    </div>
  );
}
