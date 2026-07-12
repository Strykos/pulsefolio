"use client";

import { CircleDollarSign, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { ObservatoryEyebrow } from "@/components/observatory/ObservatoryShell";
import { clamp } from "@/components/observatory/charts";
import { cn } from "@/lib/utils";

interface GuardrailItem {
  icon: LucideIcon;
  title: string;
  detail: string;
  value: number;
  max: number;
  passed: boolean;
}

interface GuardrailRailProps {
  riskScore: number;
  cashPercent: number;
  topPositionPercent: number;
}

export function GuardrailRail({ riskScore, cashPercent, topPositionPercent }: GuardrailRailProps) {
  const items: GuardrailItem[] = [
    {
      icon: ShieldCheck,
      title: "Risk within range",
      detail: `Risk score ${riskScore.toFixed(1)} ≤ 8.5`,
      value: riskScore,
      max: 10,
      passed: riskScore <= 8.5,
    },
    {
      icon: CircleDollarSign,
      title: "Cash floor met",
      detail: `Cash ${cashPercent.toFixed(1)}% ≥ 4%`,
      value: cashPercent,
      max: Math.max(20, cashPercent),
      passed: cashPercent >= 4,
    },
    {
      icon: UserRound,
      title: "No concentration",
      detail: `Top position ${topPositionPercent.toFixed(1)}% ≤ 30%`,
      value: topPositionPercent,
      max: 35,
      passed: topPositionPercent <= 30,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <ObservatoryEyebrow>Guardrails</ObservatoryEyebrow>
      <div className="grid min-h-0 flex-1 gap-3">
        {items.map((item) => (
          <GuardrailCheck key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}

function GuardrailCheck({ icon: Icon, title, detail, value, max, passed }: GuardrailItem) {
  const position = clamp((value / max) * 100, 3, 97);
  return (
    <section className="rounded-[9px] border border-obs-border bg-obs-card p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:rgba(0,212,170,.2)] bg-[color:rgba(0,212,170,.07)]">
          <Icon className="h-4 w-4 text-obs-teal" />
        </span>
        <div>
          <h2 className="text-[10px] font-medium">{title}</h2>
          <p className={cn("mt-1 text-[8px]", passed ? "text-obs-teal" : "text-red-400")}>
            {passed ? "Pass" : "Review"}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[8px] text-obs-muted">{detail}</p>
      <div className="relative mt-3 h-[3px] rounded-full bg-[#2A323E]">
        <span
          className={cn(
            "absolute -top-[2px] h-[7px] w-[7px] -translate-x-1/2 rounded-full",
            passed ? "bg-obs-teal shadow-[0_0_8px_rgba(0,212,170,.8)]" : "bg-red-400",
          )}
          style={{ left: `${position}%` }}
        />
        <span className="absolute left-1/2 top-0 h-full w-1/4 bg-[color:rgba(0,212,170,.35)]" />
      </div>
    </section>
  );
}
