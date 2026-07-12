import { cn } from "@/lib/utils";
import type { AssetClass } from "@/lib/types";

const assetClassStyles: Record<AssetClass, { bg: string; text: string }> = {
  STOCK: { bg: "bg-accent/15", text: "text-accent" },
  ETF: { bg: "bg-gain/15", text: "text-gain" },
  CRYPTO: { bg: "bg-purple-500/15", text: "text-purple-400" },
  BOND: { bg: "bg-amber-500/15", text: "text-amber-400" },
  COMMODITY: { bg: "bg-orange-500/15", text: "text-orange-400" },
  CASH: { bg: "bg-text-muted/15", text: "text-text-muted" },
};

interface AssetClassBadgeProps {
  assetClass: AssetClass;
  className?: string;
}

export function AssetClassBadge({ assetClass, className }: AssetClassBadgeProps) {
  const style = assetClassStyles[assetClass] ?? {
    bg: "bg-text-muted/15",
    text: "text-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        style.bg,
        style.text,
        className,
      )}
    >
      {assetClass}
    </span>
  );
}
