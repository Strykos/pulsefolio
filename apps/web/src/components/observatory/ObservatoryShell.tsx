"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const OBS_THEME: CSSProperties = {
  "--obs-bg": "#080C10",
  "--obs-main": "#0B1015",
  "--obs-card": "#111720",
  "--obs-raised": "#151B24",
  "--obs-border": "#222A35",
  "--obs-teal": "#00D4AA",
  "--obs-blue": "#2F8FF0",
  "--obs-purple": "#8047D9",
  "--obs-amber": "#E7AE39",
  "--obs-text": "#F2F4F5",
  "--obs-muted": "#89919E",
} as CSSProperties;

interface ObservatoryShellProps {
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
}

export function ObservatoryShell({ children, className, fillViewport = true }: ObservatoryShellProps) {
  return (
    <div
      className={cn(
        "obs-theme relative text-obs-text",
        fillViewport && "flex min-h-[calc(100dvh-58px)] flex-col gap-3",
        className,
      )}
      style={OBS_THEME}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,212,170,0.1)_0%,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative flex min-h-0 flex-1 flex-col gap-3">{children}</div>
    </div>
  );
}

interface ObservatoryGridProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  className?: string;
}

export function ObservatoryGrid({ left, center, right, className }: ObservatoryGridProps) {
  return (
    <section
      className={cn(
        "obs-grid min-h-0 flex-1 overflow-hidden rounded-[10px] border border-obs-border bg-obs-main",
        className,
      )}
    >
      <aside className="obs-rail min-w-0 border-r border-obs-border p-3">{left}</aside>
      <main className="obs-center min-w-0 overflow-y-auto p-3 sm:p-4">{center}</main>
      <aside className="obs-rail min-w-0 border-l border-obs-border p-3">{right}</aside>
      <style jsx>{`
        .obs-grid {
          display: grid;
          grid-template-columns: minmax(168px, 19%) minmax(480px, 1fr) minmax(168px, 19%);
        }
        @media (max-width: 1199px) {
          .obs-grid {
            grid-template-columns: 168px minmax(420px, 1fr) 172px;
          }
        }
        @media (max-width: 899px) {
          .obs-grid {
            display: flex;
            flex-direction: column;
            overflow: visible;
          }
          .obs-center {
            order: -1;
          }
          .obs-rail {
            border: 0;
            border-top: 1px solid var(--obs-border);
          }
        }
      `}</style>
    </section>
  );
}

export function ObservatoryEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">{children}</p>
  );
}
