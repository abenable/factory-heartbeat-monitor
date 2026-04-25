// Shared mock data for the CMMS. Replace with real telemetry source later.

export type MachineStatus = "running" | "idle" | "down" | "maintenance";

export interface Machine {
  id: string;
  name: string;
  type: string;
  sector: string;
  status: MachineStatus;
  load: number; // %
  temp: number; // °C
  pressure?: number; // PSI
  vibration?: number; // mm/s
  cycleTime?: number; // s
  errorCode?: string;
  uptime: number; // % last 30d
  lastService: string; // ISO date
  nextService: string; // ISO date
  runtimeHours: number;
}

export type AlertSeverity = "crit" | "warn" | "info";

export interface AlertEvent {
  id: string;
  timestamp: string;
  machineId: string;
  severity: AlertSeverity;
  description: string;
  acknowledged: boolean;
}

export type WorkOrderStatus = "open" | "in_progress" | "blocked" | "done";
export type WorkOrderPriority = "low" | "medium" | "high" | "critical";

export interface WorkOrder {
  id: string;
  title: string;
  machineId: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignee: string;
  createdAt: string;
  dueAt: string;
  // Optional operator-supplied details
  workArea?: string;
  equipmentStatus?: string;
  maintenanceStrategy?: string;
  estimatedHours?: number;
  numberOfWorkers?: number;
  comments?: string;
}

export function addWorkOrder(wo: WorkOrder) {
  workOrders.unshift(wo);
}

export interface PMTask {
  id: string;
  machineId: string;
  task: string;
  intervalDays: number;
  lastDone: string;
  nextDue: string;
}

export const machines: Machine[] = [
  {
    id: "STAMP-PR-01",
    name: "Hydraulic Press T5",
    type: "Hydraulic Press",
    sector: "Sector 7 — North Wing",
    status: "running",
    load: 84.2,
    temp: 42.8,
    pressure: 4200,
    vibration: 0.04,
    cycleTime: 14.2,
    uptime: 99.1,
    lastService: "2025-09-12",
    nextService: "2025-12-12",
    runtimeHours: 4218,
  },
  {
    id: "LATH-AX-09",
    name: "Multi-Axis CNC",
    type: "CNC Lathe",
    sector: "Sector 7 — North Wing",
    status: "down",
    load: 0,
    temp: 112.4,
    vibration: 0,
    errorCode: "ERR-THR-9",
    uptime: 91.4,
    lastService: "2025-08-04",
    nextService: "2025-11-04",
    runtimeHours: 6122,
  },
  {
    id: "MILL-CN-04",
    name: "Vertical Milling",
    type: "CNC Mill",
    sector: "Sector 3 — South Wing",
    status: "idle",
    load: 0,
    temp: 68.1,
    vibration: 0.02,
    uptime: 97.2,
    lastService: "2025-10-01",
    nextService: "2026-01-01",
    runtimeHours: 3420,
  },
  {
    id: "CONV-MN-02",
    name: "Main Conveyor",
    type: "Conveyor",
    sector: "Sector 1 — Assembly",
    status: "running",
    load: 76.0,
    temp: 38.5,
    vibration: 0.03,
    cycleTime: 0,
    uptime: 99.8,
    lastService: "2025-10-10",
    nextService: "2026-01-10",
    runtimeHours: 8900,
  },
  {
    id: "WELD-RB-06",
    name: "Robotic Welder",
    type: "Welding Robot",
    sector: "Sector 4 — Fabrication",
    status: "running",
    load: 91.5,
    temp: 58.7,
    vibration: 0.08,
    cycleTime: 22.1,
    uptime: 98.3,
    lastService: "2025-09-22",
    nextService: "2025-12-22",
    runtimeHours: 5230,
  },
  {
    id: "INJ-MD-11",
    name: "Injection Molder 11",
    type: "Injection Molder",
    sector: "Sector 5 — Plastics",
    status: "maintenance",
    load: 0,
    temp: 28.0,
    pressure: 0,
    uptime: 95.6,
    lastService: "2025-10-22",
    nextService: "2026-01-22",
    runtimeHours: 7140,
  },
  {
    id: "PUMP-HY-03",
    name: "Hydraulic Pump 3",
    type: "Pump",
    sector: "Sector 2 — Utilities",
    status: "running",
    load: 62.0,
    temp: 51.2,
    pressure: 3100,
    uptime: 99.5,
    lastService: "2025-09-30",
    nextService: "2025-12-30",
    runtimeHours: 11200,
  },
  {
    id: "OVEN-CR-08",
    name: "Curing Oven 8",
    type: "Industrial Oven",
    sector: "Sector 6 — Finishing",
    status: "running",
    load: 88.0,
    temp: 184.6,
    uptime: 98.9,
    lastService: "2025-10-05",
    nextService: "2026-01-05",
    runtimeHours: 6750,
  },
  {
    id: "GRND-SF-12",
    name: "Surface Grinder",
    type: "Grinder",
    sector: "Sector 3 — South Wing",
    status: "idle",
    load: 0,
    temp: 32.0,
    vibration: 0.01,
    uptime: 96.7,
    lastService: "2025-08-18",
    nextService: "2025-11-18",
    runtimeHours: 2980,
  },
];

export const alerts: AlertEvent[] = [
  {
    id: "A-1042",
    timestamp: "2025-10-24T14:02:41Z",
    machineId: "LATH-AX-09",
    severity: "crit",
    description: "Spindle bearing thermal threshold exceeded (>110°C). Auto-shutdown engaged.",
    acknowledged: false,
  },
  {
    id: "A-1041",
    timestamp: "2025-10-24T13:45:12Z",
    machineId: "MILL-CN-04",
    severity: "warn",
    description: "Coolant pressure variance detected. Deviation: -4.2%.",
    acknowledged: false,
  },
  {
    id: "A-1040",
    timestamp: "2025-10-24T13:18:09Z",
    machineId: "WELD-RB-06",
    severity: "warn",
    description: "Vibration spike on axis Z (0.08 mm/s). Inspect spindle bearing.",
    acknowledged: false,
  },
  {
    id: "A-1039",
    timestamp: "2025-10-24T11:10:05Z",
    machineId: "STAMP-PR-01",
    severity: "info",
    description: "Routine calibration cycle completed successfully. Offset adjusted.",
    acknowledged: true,
  },
  {
    id: "A-1038",
    timestamp: "2025-10-24T09:42:00Z",
    machineId: "OVEN-CR-08",
    severity: "info",
    description: "Setpoint reached 185°C. Cure cycle nominal.",
    acknowledged: true,
  },
  {
    id: "A-1037",
    timestamp: "2025-10-24T08:30:00Z",
    machineId: "CONV-MN-02",
    severity: "info",
    description: "Shift change logged. Operator 04 session initiated.",
    acknowledged: true,
  },
  {
    id: "A-1036",
    timestamp: "2025-10-23T22:14:55Z",
    machineId: "INJ-MD-11",
    severity: "warn",
    description: "Hydraulic pressure dropped below 2800 PSI. Operator paused machine.",
    acknowledged: true,
  },
  {
    id: "A-1035",
    timestamp: "2025-10-23T18:02:18Z",
    machineId: "PUMP-HY-03",
    severity: "info",
    description: "Filter change reminder due in 5 days.",
    acknowledged: true,
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: "WO-2041",
    title: "Replace spindle bearing — emergency",
    machineId: "LATH-AX-09",
    status: "in_progress",
    priority: "critical",
    assignee: "T. Vance",
    createdAt: "2025-10-24T14:05:00Z",
    dueAt: "2025-10-24T20:00:00Z",
  },
  {
    id: "WO-2040",
    title: "Investigate coolant pressure deviation",
    machineId: "MILL-CN-04",
    status: "open",
    priority: "high",
    assignee: "R. Kapoor",
    createdAt: "2025-10-24T13:50:00Z",
    dueAt: "2025-10-25T17:00:00Z",
  },
  {
    id: "WO-2039",
    title: "Inspect Z-axis vibration",
    machineId: "WELD-RB-06",
    status: "open",
    priority: "medium",
    assignee: "M. Okafor",
    createdAt: "2025-10-24T13:25:00Z",
    dueAt: "2025-10-26T17:00:00Z",
  },
  {
    id: "WO-2038",
    title: "Quarterly PM — Injection Molder 11",
    machineId: "INJ-MD-11",
    status: "in_progress",
    priority: "medium",
    assignee: "L. Ferreira",
    createdAt: "2025-10-23T08:00:00Z",
    dueAt: "2025-10-24T18:00:00Z",
  },
  {
    id: "WO-2037",
    title: "Replace hydraulic filter",
    machineId: "PUMP-HY-03",
    status: "open",
    priority: "low",
    assignee: "Unassigned",
    createdAt: "2025-10-22T10:00:00Z",
    dueAt: "2025-10-29T17:00:00Z",
  },
  {
    id: "WO-2036",
    title: "Belt tension calibration",
    machineId: "CONV-MN-02",
    status: "blocked",
    priority: "low",
    assignee: "J. Park",
    createdAt: "2025-10-21T14:00:00Z",
    dueAt: "2025-10-28T17:00:00Z",
  },
  {
    id: "WO-2035",
    title: "Calibration cycle — Press T5",
    machineId: "STAMP-PR-01",
    status: "done",
    priority: "low",
    assignee: "T. Vance",
    createdAt: "2025-10-20T09:00:00Z",
    dueAt: "2025-10-24T11:00:00Z",
  },
];

export const pmTasks: PMTask[] = [
  { id: "PM-01", machineId: "STAMP-PR-01", task: "Hydraulic fluid check", intervalDays: 30, lastDone: "2025-10-12", nextDue: "2025-11-11" },
  { id: "PM-02", machineId: "LATH-AX-09", task: "Spindle lubrication", intervalDays: 14, lastDone: "2025-10-15", nextDue: "2025-10-29" },
  { id: "PM-03", machineId: "MILL-CN-04", task: "Coolant flush", intervalDays: 60, lastDone: "2025-09-01", nextDue: "2025-10-31" },
  { id: "PM-04", machineId: "CONV-MN-02", task: "Belt tension inspection", intervalDays: 45, lastDone: "2025-09-25", nextDue: "2025-11-09" },
  { id: "PM-05", machineId: "WELD-RB-06", task: "Torch tip replacement", intervalDays: 21, lastDone: "2025-10-10", nextDue: "2025-10-31" },
  { id: "PM-06", machineId: "INJ-MD-11", task: "Quarterly overhaul", intervalDays: 90, lastDone: "2025-10-22", nextDue: "2026-01-20" },
  { id: "PM-07", machineId: "PUMP-HY-03", task: "Filter replacement", intervalDays: 30, lastDone: "2025-09-30", nextDue: "2025-10-30" },
  { id: "PM-08", machineId: "OVEN-CR-08", task: "Heating element calibration", intervalDays: 60, lastDone: "2025-10-05", nextDue: "2025-12-04" },
  { id: "PM-09", machineId: "GRND-SF-12", task: "Wheel balance check", intervalDays: 30, lastDone: "2025-10-18", nextDue: "2025-11-17" },
];

export function getMachine(id: string) {
  return machines.find((m) => m.id === id);
}

export function statusColor(status: MachineStatus): "ok" | "warn" | "crit" | "info" {
  switch (status) {
    case "running":
      return "ok";
    case "idle":
      return "warn";
    case "down":
      return "crit";
    case "maintenance":
      return "info";
  }
}

export function statusLabel(status: MachineStatus): string {
  return {
    running: "RUNNING",
    idle: "IDLE",
    down: "DOWN",
    maintenance: "MAINT",
  }[status];
}

/**
 * Backlog = work orders that are not done AND are either past their due date
 * OR have been open for more than 3 days. Used for fleet + per-machine views.
 */
export function isBacklog(wo: WorkOrder, now: Date = new Date()): boolean {
  if (wo.status === "done") return false;
  const due = new Date(wo.dueAt);
  if (due.getTime() < now.getTime()) return true;
  const created = new Date(wo.createdAt);
  const ageDays = (now.getTime() - created.getTime()) / 86_400_000;
  return ageDays > 3;
}

export function getBacklog(machineId?: string, now: Date = new Date()): WorkOrder[] {
  return workOrders.filter(
    (w) => isBacklog(w, now) && (!machineId || w.machineId === machineId),
  );
}

