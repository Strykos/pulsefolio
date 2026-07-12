"use client";

import { Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { ThemeSwitcher } from "@/components/settings/ThemeSwitcher";
import { ModeToggle } from "@/components/trading/ModeToggle";
import { ActionBar } from "@/components/observatory/ActionBar";
import { RiskGauge } from "@/components/observatory/MetricGauges";
import { ObservatoryEyebrow, ObservatoryGrid, ObservatoryShell } from "@/components/observatory/ObservatoryShell";
import { PageBanner } from "@/components/ui/PageBanner";
import type { SettingsData } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  settings: SettingsData;
  onUpdate: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
}

const RISK_SCORES = { conservative: 3.2, balanced: 5.5, growth: 7.8 } as const;

export function SettingsView({ settings, onUpdate }: SettingsViewProps) {
  const { themeId, setThemeId } = useTheme();
  const riskScore = RISK_SCORES[settings.riskProfile];

  return (
    <ObservatoryShell>

      <ObservatoryGrid
        left={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Trading mode</ObservatoryEyebrow>
            <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
              <ModeToggle mode={settings.mode} onChange={(mode) => onUpdate("mode", mode)} />
            </div>
            <ObservatoryEyebrow>Appearance</ObservatoryEyebrow>
            <div className="rounded-[9px] border border-obs-border bg-obs-card p-3">
              <ThemeSwitcher value={themeId} onChange={setThemeId} />
            </div>
          </div>
        }
        center={
          <div className="flex min-h-full flex-col gap-4">
            <h2 className="text-[clamp(17px,1.8vw,24px)] font-medium tracking-[-0.035em]">Preferences</h2>

            <div className="rounded-[9px] border border-obs-border bg-obs-card p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">Risk profile</p>
              <div className="mt-3 flex gap-2">
                {(["conservative", "balanced", "growth"] as const).map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => onUpdate("riskProfile", profile)}
                    className={cn(
                      "flex-1 rounded-[8px] border px-3 py-2.5 text-[11px] font-medium capitalize transition-colors",
                      settings.riskProfile === profile
                        ? "border-[color:rgba(0,212,170,.4)] bg-[color:rgba(0,212,170,.08)] text-obs-teal"
                        : "border-obs-border text-obs-muted hover:text-obs-text",
                    )}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[9px] border border-obs-border bg-obs-card p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-obs-muted">Motion</p>
              <div className="mt-3 flex gap-2">
                {(["full", "reduced", "off"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onUpdate("motionIntensity", level)}
                    className={cn(
                      "flex-1 rounded-[8px] border px-3 py-2.5 text-[11px] font-medium capitalize transition-colors",
                      settings.motionIntensity === level
                        ? "border-[color:rgba(0,212,170,.4)] bg-[color:rgba(0,212,170,.08)] text-obs-teal"
                        : "border-obs-border text-obs-muted hover:text-obs-text",
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[9px] border border-obs-border bg-obs-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Trade sound</p>
                  <p className="text-[10px] text-obs-muted">Play ping on trade execution</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate("soundEnabled", !settings.soundEnabled)}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition-colors",
                    settings.soundEnabled ? "bg-obs-teal" : "bg-obs-raised",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform",
                      settings.soundEnabled ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        }
        right={
          <div className="flex h-full flex-col gap-3">
            <ObservatoryEyebrow>Risk preview</ObservatoryEyebrow>
            <div className="rounded-[9px] border border-obs-border bg-obs-card">
              <RiskGauge current={riskScore} proposed={riskScore} />
            </div>
            <div className="space-y-2">
              <NavLink label="Portfolio editor" />
              <NavLink label="Guardrails" />
            </div>
          </div>
        }
      />

      <ActionBar
        items={[
          { label: "Briefing", sublabel: "Return to dashboard", icon: ShieldCheck, href: "/dashboard" },
          { label: "Decision review", sublabel: "Visual analysis", icon: SlidersHorizontal, href: "/decision", variant: "primary" },
          { label: "Activity", sublabel: "Trade log", icon: Settings, href: "/trades" },
        ]}
      />
    </ObservatoryShell>
  );
}

function NavLink({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full rounded-[9px] border border-obs-border bg-obs-card px-4 py-3 text-left text-[11px] font-medium transition-colors hover:border-[color:rgba(0,212,170,.3)]"
    >
      {label} →
    </button>
  );
}
