"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  mode: "manual" | "auto";
  onChange: (mode: "manual" | "auto") => void;
  className?: string;
}

export function ModeToggle({ mode, onChange, className }: ModeToggleProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">Trading Mode</span>
        <div className="relative flex rounded-lg bg-surface-elevated p-1">
          {(["manual", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChange(m)}
              className={cn(
                "relative rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                mode === m ? "text-text-primary" : "text-text-muted",
              )}
            >
              {mode === m && (
                <motion.div
                  layoutId="mode-toggle"
                  className="absolute inset-0 rounded-md border border-accent/30 bg-accent/20"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {mode === "auto" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-md border border-accent/20 bg-accent/10 px-3 py-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Cloud className="h-4 w-4 text-accent" />
              </motion.div>
              <span className="text-xs text-accent font-medium">
                Running in cloud 24/7
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
