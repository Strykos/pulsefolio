"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionBarItem {
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  disabled?: boolean;
}

interface ActionBarProps {
  items: ActionBarItem[];
  className?: string;
}

export function ActionBar({ items, className }: ActionBarProps) {
  return (
    <div className={cn("obs-action-grid grid h-[76px] shrink-0 gap-3", className)}>
      {items.map((item) => {
        const content = (
          <>
            <item.icon className={cn("h-5 w-5", item.variant === "primary" ? "h-6 w-6" : "text-obs-muted")} />
            <span>
              <span className={cn("block", item.variant === "primary" ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
              {item.sublabel && (
                <span className="mt-0.5 block text-[10px] font-normal text-obs-muted">{item.sublabel}</span>
              )}
            </span>
            <ChevronRight className="ml-auto h-4 w-4 text-obs-muted" />
          </>
        );

        const classes = cn(
          "obs-action-button flex min-w-0 items-center gap-3 rounded-[9px] border px-4 text-left text-xs transition",
          item.variant === "primary"
            ? "border-[color:rgba(17,201,151,.65)] bg-gradient-to-br from-[#18d8a5] to-[#08b98b] text-[#06120e] shadow-[0_0_22px_rgba(0,212,170,.12)]"
            : "border-obs-border bg-gradient-to-br from-[#151b24] to-[#10161e] text-obs-text",
          item.disabled && "cursor-not-allowed opacity-60",
        );

        if (item.href && !item.disabled) {
          return (
            <Link key={item.label} href={item.href} className={classes}>
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            className={classes}
          >
            {content}
          </button>
        );
      })}
      <style jsx>{`
        .obs-action-grid {
          grid-template-columns: repeat(${items.length}, minmax(0, 1fr));
        }
        .obs-action-button:hover:not(:disabled) {
          border-color: #364252;
        }
        @media (max-width: 899px) {
          .obs-action-grid {
            height: auto;
            grid-template-columns: 1fr 1fr;
          }
          .obs-action-button {
            min-height: 66px;
          }
        }
      `}</style>
    </div>
  );
}
