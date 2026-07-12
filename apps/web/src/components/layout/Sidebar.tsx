"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PaperTradingBadge } from "@/components/brand/PaperTradingBadge";
import { navItems } from "@/lib/nav";

export function Sidebar({ pendingTrades = 0 }: { pendingTrades?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-card-border lg:bg-surface">
      <div className="flex flex-col gap-4 px-6 py-7">
        <BrandLogo variant="wordmark" size="md" />
        <PaperTradingBadge compact />
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-elevated text-text-primary shadow-[inset_0_0_0_1px_rgba(0,212,170,0.12)]"
                      : "text-text-muted hover:bg-bg hover:text-text-primary",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 h-5 w-5",
                      active && "text-accent",
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                  {item.href === "/trades" && pendingTrades > 0 && (
                    <span className="relative z-10 ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {pendingTrades}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-card-border p-4">
        <p className="text-[10px] leading-4 text-text-muted">
          Private, guardrailed portfolio intelligence.
        </p>
      </div>
    </aside>
  );
}
