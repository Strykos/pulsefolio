import { Database, TriangleAlert } from "lucide-react";

interface PageBannerProps {
  kind: "demo" | "error";
  children: React.ReactNode;
}

export function PageBanner({ kind, children }: PageBannerProps) {
  const Icon = kind === "demo" ? Database : TriangleAlert;

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={
        kind === "demo"
          ? "flex items-center gap-2 border-b border-card-border pb-4 text-xs text-text-muted"
          : "flex items-center gap-2 rounded-md border border-loss/20 bg-loss/10 px-3 py-2 text-sm text-loss"
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}
