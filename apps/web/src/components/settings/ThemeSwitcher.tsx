"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { themeList, type ThemeId } from "@/lib/themes";

interface ThemeSwitcherProps {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  className?: string;
}

export function ThemeSwitcher({ value, onChange, className }: ThemeSwitcherProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {themeList.map((theme) => {
        const selected = value === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id as ThemeId)}
            className={cn(
              "relative overflow-hidden rounded-lg border p-3 text-left transition-all",
              selected
                ? "border-accent ring-2 ring-accent/30"
                : "border-card-border hover:border-text-muted/50",
            )}
          >
            <div
              className="mb-2 h-12 rounded-md border"
              style={{
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.cardBorder,
              }}
            >
              <div className="flex h-full items-end gap-1 p-2">
                <div
                  className="h-4 w-4 rounded-sm"
                  style={{ backgroundColor: theme.colors.gain }}
                />
                <div
                  className="h-6 w-2 rounded-sm"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: theme.colors.surface }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold">{theme.name}</span>
            <p className="text-[10px] text-text-muted mt-0.5">{theme.mood}</p>
            {selected && (
              <motion.div
                layoutId="theme-check"
                className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent"
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </button>
        );
      })}
    </div>
  );
}
