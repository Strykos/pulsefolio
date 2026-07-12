"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/websocket";

interface LiveIndicatorProps {
  status: ConnectionStatus;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<
  ConnectionStatus,
  { color: string; label: string; pulse: boolean }
> = {
  connected: { color: "bg-gain", label: "Live", pulse: true },
  connecting: { color: "bg-amber-400", label: "Connecting", pulse: true },
  disconnected: { color: "bg-text-muted", label: "Offline", pulse: false },
};

export function LiveIndicator({ status, className, showLabel = true }: LiveIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <motion.span
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", config.color)}
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", config.color)} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-text-muted">{config.label}</span>
      )}
    </div>
  );
}
