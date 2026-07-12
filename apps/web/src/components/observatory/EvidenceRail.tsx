"use client";

import type { Position } from "@/lib/types";
import { ObservatoryEyebrow } from "@/components/observatory/ObservatoryShell";
import {
  AllocationDriftChart,
  CashFloorChart,
  ConcentrationChart,
  EvidenceCard,
} from "@/components/observatory/charts";

interface EvidenceRailProps {
  positions: Position[];
  cashTrend?: number;
  topPositionPercent: number;
}

export function EvidenceRail({ positions, cashTrend = 5.6, topPositionPercent }: EvidenceRailProps) {
  return (
    <div className="flex h-full flex-col">
      <ObservatoryEyebrow>Why now</ObservatoryEyebrow>
      <div className="grid min-h-0 flex-1 gap-2">
        <EvidenceCard index="1" title="Allocation drift">
          <AllocationDriftChart positions={positions} />
        </EvidenceCard>
        <EvidenceCard index="2" title="Cash floor">
          <CashFloorChart evidenceTrend={cashTrend} />
        </EvidenceCard>
        <EvidenceCard index="3" title="Concentration">
          <ConcentrationChart current={topPositionPercent} />
        </EvidenceCard>
      </div>
    </div>
  );
}
