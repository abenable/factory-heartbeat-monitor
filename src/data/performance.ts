import { machines } from "./cmms";

export const costTrend = [
  { month: "Jan", planned: 12400, actual: 11800 },
  { month: "Feb", planned: 13200, actual: 14100 },
  { month: "Mar", planned: 12800, actual: 12500 },
  { month: "Apr", planned: 13500, actual: 13900 },
  { month: "May", planned: 14200, actual: 13800 },
];

export const qualityBreakdown = [
  { name: "Pass", value: 78, color: "#22c55e" },
  { name: "Rework", value: 14, color: "#f59e0b" },
  { name: "Scrap", value: 8, color: "#ef4444" },
];

export const plantPerformance = {
  current: 94.2,
  previous: 91.8,
  target: 95.0,
};

/** Blended production value lost for every hour a machine is offline. */
export const DOWNTIME_COST_PER_HOUR = 150; // USD

export interface DowntimeCostItem {
  id: string;
  name: string;
  sector: string;
  uptime: number;
  downtimeHours: number;
  cost: number;
}

export interface DowntimeCostAnalysis {
  items: DowntimeCostItem[];
  totalDowntimeHours: number;
  totalCost: number;
  topMachine: DowntimeCostItem;
  avgCost: number;
  byCost: DowntimeCostItem[];
  bySector: { name: string; cost: number }[];
}

/**
 * Calculates downtime cost analysis from the current machine fleet.
 * Downtime hours are estimated from the last 30 days of uptime telemetry.
 */
export function getDowntimeCostAnalysis(): DowntimeCostAnalysis {
  const items = machines.map((m) => {
    const downtimeHours = (100 - m.uptime) * 7.2; // 30d × 24h / 100
    return {
      id: m.id,
      name: m.name,
      sector: m.sector,
      uptime: m.uptime,
      downtimeHours,
      cost: downtimeHours * DOWNTIME_COST_PER_HOUR,
    };
  });

  const totalDowntimeHours = items.reduce((sum, i) => sum + i.downtimeHours, 0);
  const totalCost = items.reduce((sum, i) => sum + i.cost, 0);
  const avgCost = totalCost / (items.length || 1);
  const byCost = [...items].sort((a, b) => b.cost - a.cost);
  const topMachine = byCost[0] ?? items[0];

  const sectorMap = new Map<string, number>();
  items.forEach((i) => {
    sectorMap.set(i.sector, (sectorMap.get(i.sector) || 0) + i.cost);
  });
  const bySector = Array.from(sectorMap.entries())
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost);

  return {
    items,
    totalDowntimeHours,
    totalCost,
    topMachine,
    avgCost,
    byCost,
    bySector,
  };
}
