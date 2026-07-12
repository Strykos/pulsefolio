"use client";

import { useEffect, useState } from "react";
import { LiveIndicator } from "@/components/chrome/LiveIndicator";
import { PaperTradingBadge } from "@/components/brand/PaperTradingBadge";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { useWebSocketContext } from "@/providers/WebSocketProvider";
import { api } from "@/lib/api";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  variant?: "default" | "observatory";
}

export function AppShell({ children, title, showHeader = true, variant = "default" }: AppShellProps) {
  const { status } = useWebSocketContext();
  const [pendingTrades, setPendingTrades] = useState(0);

  useEffect(() => {
    api.getDashboard().then(({ data }) => {
      if (data) setPendingTrades(data.pendingTrades);
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-bg text-text-primary">
      <Sidebar pendingTrades={pendingTrades} />

      <div className="min-w-0 flex-1">
        {showHeader && (
          <header className="sticky top-0 z-30 grid h-[58px] grid-cols-[1fr_auto_1fr] items-center border-b border-card-border bg-bg/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              {title && (
                <h1 className="truncate text-sm font-semibold tracking-[-0.02em] sm:text-base">{title}</h1>
              )}
            </div>
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.17em] text-text-muted sm:block">
              AI wealth copilot
            </span>
            <div className="flex items-center justify-end gap-3">
              <LiveIndicator status={status} />
              <PaperTradingBadge compact className="hidden sm:inline-flex" />
            </div>
          </header>
        )}

        <main
          className={
            variant === "observatory"
              ? "px-3 py-3 pb-24 lg:px-4 lg:py-3 lg:pb-12"
              : "px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-12"
          }
        >
          <div
            className={
              variant === "observatory" ? "mx-auto w-full max-w-[1536px]" : "mx-auto w-full max-w-[1440px]"
            }
          >
            {children}
          </div>
        </main>
      </div>

      <MobileNav pendingTrades={pendingTrades} />
    </div>
  );
}
