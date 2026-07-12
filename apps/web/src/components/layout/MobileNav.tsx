"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav";

export function MobileNav({ pendingTrades = 0 }: { pendingTrades?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-card-border bg-bg/95 backdrop-blur-lg lg:hidden">
      <ul className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href} className="relative flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-text-muted",
                )}
              >
                <div className="relative">
                  <motion.div
                    animate={active ? { scale: 1.12 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  {item.href === "/trades" && pendingTrades > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg">
                      {pendingTrades}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                    />
                  )}
                </div>
                <span>{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
