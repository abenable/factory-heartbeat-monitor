// Shared mock data for the CMMS. Replace with real telemetry source later.

import { hydrateFromStorage, persistToStorage } from "@/lib/persistedStore";

export type MachineStatus = "running" | "idle" | "down" | "maintenance";

export const SECTORS = [
  "Machine Shop",
  "Welding Line",
  "Paint Shop",
  "Trim Shop",
  "Chassis Line 1",
  "Chassis Line 2",
  "QIT",
] as const;

export type Sector = (typeof SECTORS)[number];

export interface SparePart {
  partNumber: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface Machine {
  // ── Core telemetry ──
  id: string;
  name: string;
  type: string;
  sector: Sector;
  plant: string;
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

  // ── 1. Asset Identification ──
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;

  // ── 2. Location & Installation ──
  section?: string;
  line?: string;
  installationDate?: string;
  commissioningDate?: string;

  // ── 3. Technical Specifications ──
  powerRating?: string;
  capacity?: string;
  speed?: string;
  operatingParameters?: string;
  designLimits?: string;

  // ── 4. Maintenance Information ──
  maintenanceProcedures?: string;
  requiredTools?: string;
  safetyInstructions?: string;

  // ── 5. Spare Parts & BOM ──
  spareParts?: SparePart[];

  // ── 6. Assigned Personnel ──
  assignedTechnicians?: string[]; // worker usernames
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
export type WorkOrderPriority = "low" | "normal" | "urgent" | "emergency";
export type WorkOrderType = "corrective" | "preventive" | "predictive" | "condition-based";

export interface WorkOrderTask {
  description: string;
  completed?: boolean;
}

export interface WorkOrderResource {
  tools: string[];
  spareParts: string[];
  ppe: string[];
}

export interface WorkOrderSchedule {
  startDate: string;
  expectedCompletion: string;
  actualStart?: string;
  actualCompletion?: string;
}

export interface WorkOrderWorkLog {
  actualStartTime?: string;
  actualCompletionTime?: string;
  partsUsed?: string;
  observations?: string;
  rootCause?: string;
  /** Challenges or blockers encountered while performing the job. */
  challengesFaced?: string;
  /** Free-form technician comments for the work order — printed as "Remarks (After Completion of Work)". */
  comments?: string;
  /** Photos taken by the technician to document the work or challenges. */
  images?: { name: string; dataUrl: string }[];

  // ── Printed on the paper "Maintenance Work Order Form" completion section ──
  descriptionOfWorkCompleted?: string;
  explanationOfIncompleteWork?: string;
  /** Typed name used as the technician's completion signature. */
  completedByName?: string;
  /** Typed name used as the supervisor's approval signature. */
  approvedByName?: string;
  approvedAt?: string;
}

export interface WorkOrder {
  id: string;
  /** Machine-readable work-order ID, e.g. WO-2041. */
  title: string;
  machineId: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  assignee: string;
  department?: string;
  createdAt: string;
  dueAt: string;

  // Enhanced WO fields
  problemDescription?: string;
  tasks: WorkOrderTask[];
  schedule?: WorkOrderSchedule;
  resources?: WorkOrderResource;
  authorizedBy?: string;
  workLog?: WorkOrderWorkLog;

  /** Human-readable maintenance reference number shown on cards/reports, e.g. M-2041. */
  referenceNumber?: string;

  // ── Technician receipt ── set when the assigned technician confirms they've
  // received this work order, before they click Start (which moves status to in_progress).
  acknowledgedAt?: string;
  /** Typed name used as the technician's receipt confirmation. */
  acknowledgedByName?: string;

  // ── Requestor (printed on the paper "Maintenance Work Order Form") ──
  requestorName?: string;
  requestorEmail?: string;
  requestorDesignation?: string;
  /** Workshop / station where the equipment is located, distinct from `department`. */
  workshop?: string;

  // Legacy optional fields (for backward compat)
  workArea?: string;
  equipmentStatus?: string;
  maintenanceStrategy?: string;
  estimatedHours?: number;
  numberOfWorkers?: number;
  comments?: string;
}

export function addWorkOrder(wo: WorkOrder) {
  workOrders.unshift(wo);
  persistToStorage("workOrders", workOrders);
}

/**
 * Auto-generates the next "CWO-####" reference number, matching the numbering
 * on the printed Maintenance Work Order Form. Scans existing work orders for
 * the highest CWO-prefixed sequence and increments it.
 */
export function nextWorkOrderReferenceNumber(): string {
  const prefix = "CWO-";
  const seqs = workOrders
    .map((w) => w.referenceNumber ?? "")
    .filter((r) => r.startsWith(prefix))
    .map((r) => Number(r.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  const next = (seqs.length ? Math.max(...seqs) : 200) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function updateWorkOrder(id: string, updates: Partial<WorkOrder>) {
  const idx = workOrders.findIndex((w) => w.id === id);
  if (idx !== -1) {
    workOrders[idx] = { ...workOrders[idx], ...updates };
    persistToStorage("workOrders", workOrders);
  }
}

export type PMFrequency = "daily" | "weekly" | "monthly" | "quarterly";

export interface PMChecklistItem {
  id: string;
  section: string;
  description: string;
  result?: "ok" | "faulty" | "na";
}

export interface PMCompletionLog {
  id: string;
  completedAt: string;
  completedBy: string; // worker username
  startTime?: string;
  endTime?: string;
  /** Actual hours the visit took — the source of truth for duration estimates. */
  durationHours?: number;
  /** Snapshot of the checklist results recorded during this visit. */
  items: PMChecklistItem[];
  remarks?: string;

  // ── Supervisor approval of this completed visit ──
  /** Typed name used as the supervisor's soft-copy approval signature. */
  approvedByName?: string;
  approvedAt?: string;
}

export interface PMTask {
  id: string;
  /** e.g. KMC/DPD/2026/CL0201 — mirrors the paper Equipment Maintenance Checklist. */
  referenceNumber?: string;
  machineId: string;
  task: string;
  intervalDays: number;
  lastDone: string;
  nextDue: string;
  frequency?: PMFrequency;
  procedures?: string;
  requiredTools?: string;
  safetyInstructions?: string;
  personInCharge?: string; // worker username — assigned technician
  scheduledBy?: string; // worker username — supervisor who scheduled/assigned it
  workshop?: string;
  department?: string;
  /** Manual override for the estimated visit duration; history-based average is preferred when available. */
  estimatedHours?: number;
  /** Sectioned checklist for the next scheduled visit. */
  checklist: PMChecklistItem[];
  /** Past completed visits — the source of "who completed it and how long it took". */
  history: PMCompletionLog[];

  // ── Current visit workflow ──
  /**
   * Status of the CURRENT visit cycle — same 4 states as a work order, so
   * technician-facing filters/badges behave identically for both. Set to
   * "in_progress" the moment the technician confirms receipt (acknowledging
   * and starting both live in that one bucket), "blocked" if they report a
   * blocker, and "done" once completePMVisit() logs the visit — it then
   * stays "done" (along with who/when acknowledged it) until the technician
   * acknowledges the *next* cycle, which overwrites it back to "in_progress".
   */
  visitStatus: WorkOrderStatus;
  visitAcknowledgedAt?: string;
  /** Typed name used as the technician's receipt confirmation for the current visit. */
  visitAcknowledgedByName?: string;
  visitStartedAt?: string;
  /** Reason the technician gave when marking the current visit blocked. */
  visitBlockedReason?: string;
}

/**
 * Standard sectioned checklist template for the Equipment Maintenance
 * Checklist paper form (panel/electrical & control-systems PM), used to
 * generate a fresh checklist for every machine and every completed visit.
 */
export const PM_CHECKLIST_TEMPLATE: { section: string; items: string[] }[] = [
  {
    section: "Panel Distribution, LV Transformer & Protection",
    items: [
      "Visual inspection of switchgear/panel — check for burn marks or discoloration",
      "Check tightness of terminal and busbar connections",
      "Check earthing/bonding continuity",
      "Insulation resistance (megger) test",
    ],
  },
  {
    section: "PLC / DCS & Control Electronics",
    items: [
      "Visual inspection of status/fault LEDs",
      "Backup battery / UPS health check",
      "Program and configuration backup verified",
      "Review alarm and event logs",
    ],
  },
  {
    section: "Inverters, VFDs, Motor Drivers & Converters",
    items: [
      "Check for stored fault/error codes",
      "Cooling fan and filter check",
      "Terminal tightness check",
    ],
  },
  {
    section: "Motors & Servo Drives",
    items: [
      "Vibration and abnormal noise check",
      "Insulation resistance (megger) check",
      "Bearing lubrication check",
      "Alignment and coupling check",
    ],
  },
  {
    section: "Temperature Controllers & Panel Thermal Management",
    items: [
      "Sensor calibration check",
      "Panel fan/filter cleaning",
      "Thermal scan for hot spots",
      "Setpoint verification",
    ],
  },
  {
    section: "Contactors, Relays & Starters",
    items: [
      "Visual/thermal wear inspection",
      "Contact resistance check",
      "Coil voltage check",
    ],
  },
  {
    section: "Alarms, Beacons & Signal Lights",
    items: [
      "Functional test of audible alarms",
      "Beacon and signal light check",
    ],
  },
  {
    section: "Batteries & Backup Power",
    items: [
      "Battery voltage and charge check",
      "Terminal corrosion check",
    ],
  },
  {
    section: "Cooling, Earthing & Bonding",
    items: [
      "Visual inspection, IR scanning where available",
    ],
  },
];

let pmChecklistItemSeq = 0;
export function buildPMChecklist(): PMChecklistItem[] {
  return PM_CHECKLIST_TEMPLATE.flatMap((sec) =>
    sec.items.map((description) => ({
      id: `pmi-${++pmChecklistItemSeq}`,
      section: sec.section,
      description,
    })),
  );
}

export const PM_DEFAULT_HOURS: Record<PMFrequency, number> = {
  daily: 1,
  weekly: 1.5,
  monthly: 2,
  quarterly: 3,
};

/**
 * Estimated visit duration: the average of actual logged durations from past
 * completions when available (the real signal), falling back to a manual
 * override or a sensible default for the task's frequency.
 */
export function estimatedPMHours(task: PMTask): { hours: number; source: "history" | "manual" | "default" } {
  const logged = task.history.map((h) => h.durationHours).filter((h): h is number => typeof h === "number" && h > 0);
  if (logged.length > 0) {
    return { hours: logged.reduce((s, h) => s + h, 0) / logged.length, source: "history" };
  }
  if (task.estimatedHours) return { hours: task.estimatedHours, source: "manual" };
  return { hours: PM_DEFAULT_HOURS[task.frequency ?? "monthly"], source: "default" };
}

export function pmDaysUntil(iso: string, now: Date = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isPMOverdue(task: PMTask, now: Date = new Date()): boolean {
  return pmDaysUntil(task.nextDue, now) <= 0;
}

export function isPMDueSoon(task: PMTask, withinDays = 7, now: Date = new Date()): boolean {
  const days = pmDaysUntil(task.nextDue, now);
  return days > 0 && days <= withinDays;
}

export function getPMTask(id: string): PMTask | undefined {
  return pmTasks.find((p) => p.id === id);
}

/** Sorts PM tasks by their paper-form reference number (falls back to id), so
 *  listings match the order technicians/supervisors expect from the physical
 *  checklist binder rather than by due date. */
export function comparePMByReference(a: PMTask, b: PMTask): number {
  const ka = a.referenceNumber ?? a.id;
  const kb = b.referenceNumber ?? b.id;
  return ka.localeCompare(kb, undefined, { numeric: true, sensitivity: "base" });
}

export function nextPMTaskId(): string {
  const seqs = pmTasks
    .map((p) => Number(p.id.replace(/^PM-/, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `PM-${String(next).padStart(2, "0")}`;
}

export function addPMTask(task: PMTask) {
  pmTasks.push(task);
  persistToStorage("pmTasks", pmTasks);
}

export function updatePMTask(id: string, updates: Partial<PMTask>) {
  const idx = pmTasks.findIndex((p) => p.id === id);
  if (idx !== -1) {
    pmTasks[idx] = { ...pmTasks[idx], ...updates };
    persistToStorage("pmTasks", pmTasks);
  }
}

export function nextPMReferenceNumber(year = new Date().getFullYear()): string {
  const prefix = `KMC/DPD/${year}/CL`;
  const seqs = pmTasks
    .map((p) => p.referenceNumber ?? "")
    .filter((r) => r.startsWith(prefix))
    .map((r) => Number(r.slice(prefix.length)))
    .filter((n) => !Number.isNaN(n));
  const next = (seqs.length ? Math.max(...seqs) : 200) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

/** Record a completed PM visit: logs history, advances lastDone/nextDue, resets the checklist. */
export function completePMVisit(
  taskId: string,
  entry: Omit<PMCompletionLog, "id">,
): void {
  const task = getPMTask(taskId);
  if (!task) return;
  const completedDate = entry.completedAt.slice(0, 10);
  const next = new Date(entry.completedAt);
  next.setDate(next.getDate() + task.intervalDays);
  updatePMTask(taskId, {
    lastDone: completedDate,
    nextDue: next.toISOString().slice(0, 10),
    history: [{ id: `pmlog-${task.id}-${task.history.length + 1}`, ...entry }, ...task.history],
    checklist: buildPMChecklist(),
    visitStatus: "done",
    visitBlockedReason: undefined,
  });
}

/** Technician confirms they've received the current PM visit — moves it straight into "in_progress". */
export function acknowledgePMVisit(taskId: string, byName: string): void {
  updatePMTask(taskId, {
    visitAcknowledgedAt: new Date().toISOString(),
    visitAcknowledgedByName: byName,
    visitStartedAt: undefined,
    visitBlockedReason: undefined,
    visitStatus: "in_progress",
  });
}

/** Records the actual start time without disturbing an already-set one. */
export function startPMVisit(taskId: string): void {
  const task = getPMTask(taskId);
  if (!task) return;
  updatePMTask(taskId, {
    visitStartedAt: task.visitStartedAt ?? new Date().toISOString(),
    visitStatus: "in_progress",
  });
}

/** Technician reports they can't proceed (missing parts, access, etc). */
export function blockPMVisit(taskId: string, reason?: string): void {
  updatePMTask(taskId, { visitStatus: "blocked", visitBlockedReason: reason });
}

/** Resumes a blocked visit back into progress. */
export function resumePMVisit(taskId: string): void {
  updatePMTask(taskId, { visitStatus: "in_progress", visitBlockedReason: undefined });
}

/**
 * Supervisor approves the most recently completed visit (the "finished
 * copy" the technician submitted). Supervisors never fill in the checklist
 * themselves — this only records their soft-copy approval signature on
 * top of what the technician already logged via completePMVisit().
 */
export function approvePMVisit(taskId: string, byName: string): void {
  const task = getPMTask(taskId);
  if (!task || task.history.length === 0) return;
  const [latest, ...rest] = task.history;
  updatePMTask(taskId, {
    history: [{ ...latest, approvedByName: byName, approvedAt: new Date().toISOString() }, ...rest],
  });
}

/** True once the most recently completed visit has been approved by a supervisor. */
export function isLatestPMVisitApproved(task: PMTask): boolean {
  return Boolean(task.history[0]?.approvedByName);
}

export const machines: Machine[] = [
  // ── Machine Shop ──
  {
    id: "MS-TUBE-01",
    name: "Tube Laser Cutting Machine",
    type: "Laser Cutter",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "running",
    load: 78.4,
    temp: 44.2,
    uptime: 97.5,
    lastService: "2026-06-22",
    nextService: "2026-09-22",
    runtimeHours: 3840,
    manufacturer: "Trumpf",
    modelNumber: "TruLaser Tube 7000",
    serialNumber: "TR-TT-2020-001122",
    installationDate: "2020-07-24",
    commissioningDate: "2020-08-20",
    powerRating: "25 kW",
    capacity: "Ø 12–250 mm tube",
    speed: "120 m/min positioning",
    operatingParameters: "Assist gas N₂/O₂ 15–25 bar, focal lens temp ≤ 45°C",
    designLimits: "Max tube length 6,500 mm, max wall 12 mm",
    maintenanceProcedures: "Daily lens inspection. Weekly chucho debris clean. Monthly nozzle alignment.",
    requiredTools: "Lens wipes, nozzle gauge, alignment jig",
    safetyInstructions: "Wear laser safety goggles. Disable laser source before service.",
    spareParts: [
      { partNumber: "SP-LC-001", name: "Focusing lens 200 mm", quantity: 2, unit: "pc" },
      { partNumber: "SP-LC-005", name: "Nozzle kit 2.0 mm", quantity: 4, unit: "pc" },
    ],
    assignedTechnicians: ["Mukisa", "Oumo"],
  },
  {
    id: "MS-LATHE-01",
    name: "CNC Lathe",
    type: "CNC Lathe",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "down",
    load: 0,
    temp: 112.0,
    errorCode: "ERR-THR-09",
    uptime: 91.2,
    lastService: "2026-05-30",
    nextService: "2026-08-27",
    runtimeHours: 6122,
    manufacturer: "DMG Mori",
    modelNumber: "NTX 3000",
    serialNumber: "DMG-NTX-2018-002891",
    installationDate: "2018-11-01",
    commissioningDate: "2018-11-24",
    powerRating: "45 kW",
    capacity: "Ø 300 mm × 1,500 mm",
    speed: "12,000 rpm max",
    operatingParameters: "Spindle temp ≤ 90°C, coolant flow ≥ 15 L/min",
    designLimits: "Max spindle 14,000 rpm, max temp 120°C",
    maintenanceProcedures: "Daily chip conveyor clean. Weekly coolant pH test. Monthly ball-screw grease.",
    requiredTools: "Bore gauge, RPM tachometer, coolant test kit",
    safetyInstructions: "Ensure spindle stop before door open. Eye protection mandatory.",
    spareParts: [
      { partNumber: "SP-CNC-003", name: "Spindle bearing (7208)", quantity: 4, unit: "pc" },
      { partNumber: "SP-CNC-011", name: "Coolant pump seal", quantity: 2, unit: "pc" },
    ],
    assignedTechnicians: ["Mukisa", "Odeke"],
  },
  {
    id: "MS-MILL-01",
    name: "CNC Milling",
    type: "CNC Mill",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "idle",
    load: 0,
    temp: 38.5,
    vibration: 0.02,
    uptime: 96.8,
    lastService: "2026-06-13",
    nextService: "2026-09-13",
    runtimeHours: 4200,
    manufacturer: "Haas",
    modelNumber: "VF-4SS",
    serialNumber: "HA-VF4-2019-003344",
    installationDate: "2019-06-22",
    commissioningDate: "2019-07-14",
    powerRating: "22 kW",
    capacity: "1,270 × 508 × 635 mm",
    speed: "10,000 rpm",
    operatingParameters: "Coolant pressure 4–6 bar, table load ≤ 1,500 kg",
    designLimits: "Max RPM 12,000, rapid feed 36 m/min",
    maintenanceProcedures: "Daily way-cover chip removal. Weekly spindle warm-up. Monthly drawbar force check.",
    requiredTools: "Drawbar force gauge, way oil",
    safetyInstructions: "Lockout during spindle work. Verify tool clamp.",
    spareParts: [
      { partNumber: "SP-MILL-002", name: "Drawbar spring kit", quantity: 1, unit: "set" },
    ],
    assignedTechnicians: ["Atuhebwa", "Mukisa"],
  },
  {
    id: "MS-DRILL-01",
    name: "Drilling Machine",
    type: "Pillar Drill",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "running",
    load: 62.0,
    temp: 41.0,
    uptime: 98.1,
    lastService: "2026-07-04",
    nextService: "2026-10-04",
    runtimeHours: 5100,
    manufacturer: "Milwaukee",
    modelNumber: "MD-40V",
    serialNumber: "MW-MD40-2021-005511",
    installationDate: "2021-04-28",
    commissioningDate: "2021-05-13",
    powerRating: "4 kW",
    capacity: "Ø 40 mm steel",
    speed: "150–2,500 rpm",
    operatingParameters: "Spindle runout ≤ 0.05 mm, chuck torque check weekly",
    designLimits: "Max drill Ø 50 mm, quill stroke 150 mm",
    maintenanceProcedures: "Daily chuck clean. Weekly belt tension. Quarterly spindle bearing grease.",
    requiredTools: "Belt tension gauge, chuck key set",
    safetyInstructions: "Secure workpiece. Do not wear gloves near chuck.",
    spareParts: [
      { partNumber: "SP-DRILL-001", name: "V-belt set", quantity: 2, unit: "set" },
    ],
    assignedTechnicians: ["Odeke", "Tabalaata"],
  },
  {
    id: "MS-BEND-01",
    name: "Sheet Bending Machine",
    type: "Press Brake",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "running",
    load: 55.3,
    temp: 36.8,
    uptime: 97.0,
    lastService: "2026-06-12",
    nextService: "2026-09-09",
    runtimeHours: 3450,
    manufacturer: "Amada",
    modelNumber: "HG-1303 ATC",
    serialNumber: "AM-HG1303-2020-004422",
    installationDate: "2020-11-27",
    commissioningDate: "2020-12-17",
    powerRating: "13 kW",
    capacity: "130 T × 3,100 mm",
    speed: "200 mm/s approach",
    operatingParameters: "Back gauge accuracy ±0.01 mm, hydraulic oil 46 cSt",
    designLimits: "Max bend force 130 T, max stroke 215 mm",
    maintenanceProcedures: "Daily tool check. Monthly hydraulic filter. Annual laser alignment.",
    requiredTools: "Crow foot, hydraulic test gauge",
    safetyInstructions: "Use light curtains. Two-hand operation required.",
    spareParts: [
      { partNumber: "SP-PB-003", name: "Hydraulic filter element", quantity: 3, unit: "pc" },
    ],
    assignedTechnicians: ["Odeke"],
  },
  {
    id: "MS-SHEAR-01",
    name: "Shearing Machine",
    type: "Hydraulic Shear",
    sector: "Machine Shop",
    plant: "Jinja North",
    status: "maintenance",
    load: 0,
    temp: 29.0,
    uptime: 94.5,
    lastService: "2026-08-02",
    nextService: "2026-11-01",
    runtimeHours: 2890,
    manufacturer: "Cidan",
    modelNumber: "Proxima 30-13",
    serialNumber: "CI-PR-2019-002233",
    installationDate: "2019-08-24",
    commissioningDate: "2019-09-06",
    powerRating: "11 kW",
    capacity: "13 mm × 3,100 mm",
    speed: "18 strokes/min",
    operatingParameters: "Blade gap 0.1×material thickness, rake angle 1.5°",
    designLimits: "Max length 3,100 mm, tensile strength 450 N/mm²",
    maintenanceProcedures: "Daily blade wipe. Weekly hold-down pad check. Monthly gap adjustment.",
    requiredTools: "Feeler gauge, blade shim set",
    safetyInstructions: "Lockout during blade change. Use cut-resistant gloves.",
    spareParts: [
      { partNumber: "SP-SHEAR-001", name: "Upper blade section", quantity: 1, unit: "pc" },
    ],
    assignedTechnicians: ["Tabalaata", "Wagoli"],
  },

  // ── Welding Line ──
  {
    id: "WL-WELD-01",
    name: "Welding Machine",
    type: "MIG Welder",
    sector: "Welding Line",
    plant: "Jinja North",
    status: "running",
    load: 84.5,
    temp: 58.7,
    vibration: 0.06,
    uptime: 98.3,
    lastService: "2026-06-06",
    nextService: "2026-09-03",
    runtimeHours: 5230,
    manufacturer: "Fronius",
    modelNumber: "TPS 500i",
    serialNumber: "FR-TPS500-2020-006611",
    installationDate: "2020-06-30",
    commissioningDate: "2020-07-13",
    powerRating: "22 kW",
    capacity: "40–500 A",
    speed: "Wire feed 0.5–25 m/min",
    operatingParameters: "Gas flow 15–20 L/min, duty cycle 60% @ 500 A",
    designLimits: "Max current 500 A, max wire Ø 1.6 mm",
    maintenanceProcedures: "Daily liner check. Weekly contact tip change. Monthly gas solenoid test.",
    requiredTools: "Tip wrench, wire cutters, flow meter",
    safetyInstructions: "Ventilate fumes. Use welding PPE. Inspect earth clamp.",
    spareParts: [
      { partNumber: "SP-WLD-001", name: "Contact tip M8", quantity: 20, unit: "pc" },
      { partNumber: "SP-WLD-003", name: "Gas nozzle", quantity: 6, unit: "pc" },
    ],
    assignedTechnicians: ["Tabalaata", "Ahereza"],
  },
  {
    id: "WL-SIDE-01",
    name: "Side Panel Extension Machine",
    type: "Panel Former",
    sector: "Welding Line",
    plant: "Jinja North",
    status: "running",
    load: 71.2,
    temp: 42.0,
    uptime: 96.4,
    lastService: "2026-06-24",
    nextService: "2026-09-24",
    runtimeHours: 3100,
    manufacturer: "KUKA Systems",
    modelNumber: "PF-2500",
    serialNumber: "KU-PF2500-2021-007722",
    installationDate: "2021-04-03",
    commissioningDate: "2021-04-24",
    powerRating: "35 kW",
    capacity: "Side panel up to 2,500 mm",
    speed: "6 cycles/min",
    operatingParameters: "Clamp force 80–120 kN, pnuematic 6 bar",
    designLimits: "Max panel width 2,500 mm, stroke 400 mm",
    maintenanceProcedures: "Daily clamp pad clean. Weekly cylinder seal inspection. Monthly calibration.",
    requiredTools: "Allen key set, pneumatic gauge",
    safetyInstructions: "Lockout during die change. Keep hands clear of clamps.",
    spareParts: [
      { partNumber: "SP-PF-001", name: "Clamp pad set", quantity: 4, unit: "pc" },
    ],
    assignedTechnicians: ["Odeke", "Tabalaata"],
  },
  {
    id: "WL-UHOOP-01",
    name: "U Hoop Machine",
    type: "Roll Former",
    sector: "Welding Line",
    plant: "Jinja North",
    status: "idle",
    load: 0,
    temp: 31.5,
    uptime: 95.9,
    lastService: "2026-06-17",
    nextService: "2026-09-17",
    runtimeHours: 2760,
    manufacturer: "Dreistern",
    modelNumber: "U-Profiler 120",
    serialNumber: "DR-UP120-2020-005533",
    installationDate: "2020-09-25",
    commissioningDate: "2020-10-09",
    powerRating: "18 kW",
    capacity: "U-hoop 80–120 mm",
    speed: "24 m/min",
    operatingParameters: "Roll pressure 2–4 bar, strip thickness 1.2–2.5 mm",
    designLimits: "Max width 120 mm, min bend radius 8 mm",
    maintenanceProcedures: "Daily strip edge clean. Weekly roll gap check. Monthly gearbox oil level.",
    requiredTools: "Gap gauge, torque wrench",
    safetyInstructions: "Use coil handling gloves. Maintain strip tension.",
    spareParts: [
      { partNumber: "SP-RF-002", name: "Forming roll set", quantity: 1, unit: "set" },
    ],
    assignedTechnicians: ["Tabalaata"],
  },
  {
    id: "WL-MERGE-01",
    name: "Six Parts Merging Machine",
    type: "Assembly Fixture",
    sector: "Welding Line",
    plant: "Jinja North",
    status: "running",
    load: 68.0,
    temp: 39.4,
    uptime: 97.8,
    lastService: "2026-06-30",
    nextService: "2026-09-30",
    runtimeHours: 4100,
    manufacturer: "Comau",
    modelNumber: "BodyMerge 6X",
    serialNumber: "CO-BM6X-2021-009944",
    installationDate: "2021-06-03",
    commissioningDate: "2021-06-24",
    powerRating: "28 kW",
    capacity: "Six-part body shell",
    speed: "4 jobs/min",
    operatingParameters: "Fixture clamp force 150 kN, welding current 300 A",
    designLimits: "Max shell length 4,800 mm, weight 350 kg",
    maintenanceProcedures: "Daily nest pin inspection. Weekly robot path verification. Monthly clamp force log.",
    requiredTools: "Pin gauge, force transducer, teach pendant",
    safetyInstructions: "Light curtain active. Lockout before entering cell.",
    spareParts: [
      { partNumber: "SP-BM-001", name: "Nest pin set", quantity: 2, unit: "set" },
    ],
    assignedTechnicians: ["Ahereza", "Tabalaata"],
  },

  // ── Paint Shop ──
  {
    id: "PS-SPRAY-01",
    name: "Spraying Gun",
    type: "Paint Applicator",
    sector: "Paint Shop",
    plant: "Jinja North",
    status: "maintenance",
    load: 0,
    temp: 24.0,
    uptime: 93.7,
    lastService: "2026-07-31",
    nextService: "2026-08-30",
    runtimeHours: 1800,
    manufacturer: "Dürr",
    modelNumber: "EcoGun AS",
    serialNumber: "DU-EGAS-2022-003311",
    installationDate: "2022-10-22",
    commissioningDate: "2022-11-06",
    powerRating: "2 kW",
    capacity: "Paint flow 200–600 mL/min",
    speed: "Auto-trigger 2 Hz",
    operatingParameters: "Atomizer air 2.5 bar, pattern air 2.0 bar, fluid pressure 1.2 bar",
    designLimits: "Max fluid viscosity 25 s (DIN 4)",
    maintenanceProcedures: "Daily color-change clean. Weekly needle/seat check. Monthly pattern test.",
    requiredTools: "Wrench set, pattern test card",
    safetyInstructions: "Use respirator in booth. Ground gun before service.",
    spareParts: [
      { partNumber: "SP-SPRAY-001", name: "Needle and nozzle kit", quantity: 3, unit: "set" },
    ],
    assignedTechnicians: ["Wagoli", "Oumo"],
  },
  {
    id: "PS-POLY-01",
    name: "Polyurethane Machine",
    type: "PU Dispenser",
    sector: "Paint Shop",
    plant: "Jinja North",
    status: "running",
    load: 52.0,
    temp: 28.5,
    pressure: 140,
    uptime: 96.2,
    lastService: "2026-07-07",
    nextService: "2026-10-07",
    runtimeHours: 2200,
    manufacturer: "Graco",
    modelNumber: "Reactor E-30i",
    serialNumber: "GR-RE30-2021-002211",
    installationDate: "2021-07-15",
    commissioningDate: "2021-08-01",
    powerRating: "15 kW",
    capacity: "30 kg/min output",
    speed: "Heater ramp 2 °C/min",
    operatingParameters: "A/B temp 65–75°C, ratio 1:1, hose pressure 140 bar",
    designLimits: "Max output 40 kg/min, max hose length 120 m",
    maintenanceProcedures: "Daily flush. Weekly pump seal check. Monthly calibration cup test.",
    requiredTools: "Calibration cups, grease gun",
    safetyInstructions: "Wear chemical suit and gloves. Depressurize before service.",
    spareParts: [
      { partNumber: "SP-PU-001", name: "Pump seal kit", quantity: 1, unit: "set" },
    ],
    assignedTechnicians: ["Oumo", "Wagoli"],
  },
  {
    id: "PS-COMP-01",
    name: "Compressor",
    type: "Rotary Screw Compressor",
    sector: "Paint Shop",
    plant: "Jinja North",
    status: "running",
    load: 64.0,
    temp: 51.2,
    pressure: 7.5,
    uptime: 99.2,
    lastService: "2026-06-17",
    nextService: "2026-09-17",
    runtimeHours: 11200,
    manufacturer: "Atlas Copco",
    modelNumber: "GA 55 VSD+",
    serialNumber: "AC-GA55-2018-001100",
    installationDate: "2018-03-29",
    commissioningDate: "2018-04-15",
    powerRating: "55 kW",
    capacity: "9.1 m³/min @ 7.5 bar",
    speed: "VSD 1,500–3,000 rpm",
    operatingParameters: "Discharge pressure 7.0–7.5 bar, oil temp 75–90°C",
    designLimits: "Max pressure 10 bar, max ambient 46°C",
    maintenanceProcedures: "Daily condensate drain. Monthly oil/filter check. Annual separator element.",
    requiredTools: "Filter wrench, oil sample kit",
    safetyInstructions: "Depressurize before filter change. Ear protection near intake.",
    spareParts: [
      { partNumber: "SP-COMP-001", name: "Oil filter", quantity: 4, unit: "pc" },
      { partNumber: "SP-COMP-002", name: "Air filter element", quantity: 2, unit: "pc" },
    ],
    assignedTechnicians: ["Oumo"],
  },

  // ── Chassis Line 1 ──
  {
    id: "CL1-VIN-01",
    name: "VIN Machine",
    type: "VIN Engraver",
    sector: "Chassis Line 1",
    plant: "Jinja North",
    status: "running",
    load: 33.0,
    temp: 36.0,
    uptime: 99.5,
    lastService: "2026-06-13",
    nextService: "2026-09-13",
    runtimeHours: 1950,
    manufacturer: "SIC Marking",
    modelNumber: "e10 R i113",
    serialNumber: "SI-E10-2022-004400",
    installationDate: "2022-11-17",
    commissioningDate: "2022-11-27",
    powerRating: "1.5 kW",
    capacity: "VIN depth 0.3 mm on steel",
    speed: "12 characters/sec",
    operatingParameters: "Pin pressure 3–6 bar, depth verified by vision",
    designLimits: "Characters ISO 3780, max chassis length 6,000 mm",
    maintenanceProcedures: "Daily stylusInspect. Weekly pin replacement. Monthly vision calibration.",
    requiredTools: "Pin kit, depth gauge, calibration plaque",
    safetyInstructions: "Wear eye protection. Keep hands clear of marking head.",
    spareParts: [
      { partNumber: "SP-VIN-001", name: "Stylus pin set", quantity: 3, unit: "set" },
    ],
    assignedTechnicians: ["Mukisa"],
  },

  // ── Trim Shop ──
  {
    id: "TS-COMP-01",
    name: "Compressor",
    type: "Rotary Screw Compressor",
    sector: "Trim Shop",
    plant: "Jinja South",
    status: "running",
    load: 48.0,
    temp: 49.5,
    pressure: 7.2,
    uptime: 98.8,
    lastService: "2026-06-22",
    nextService: "2026-09-22",
    runtimeHours: 9800,
    manufacturer: "Atlas Copco",
    modelNumber: "GA 37 VSD+",
    serialNumber: "AC-GA37-2019-002200",
    installationDate: "2019-09-23",
    commissioningDate: "2019-10-06",
    powerRating: "37 kW",
    capacity: "6.3 m³/min @ 7.5 bar",
    speed: "VSD 1,500–3,000 rpm",
    operatingParameters: "Discharge pressure 7.0–7.5 bar, oil temp 75–90°C",
    designLimits: "Max pressure 10 bar, max ambient 46°C",
    maintenanceProcedures: "Daily condensate drain. Monthly oil/filter check. Annual separator element.",
    requiredTools: "Filter wrench, oil sample kit",
    safetyInstructions: "Depressurize before filter change. Ear protection near intake.",
    spareParts: [
      { partNumber: "SP-COMP-001", name: "Oil filter", quantity: 4, unit: "pc" },
    ],
    assignedTechnicians: ["Oumo", "Mutebi"],
  },

  // ── Chassis Line 2 ──
  {
    id: "CL2-SLING-01",
    name: "Loading & Offloading Sling",
    type: "Overhead Crane System",
    sector: "Chassis Line 2",
    plant: "Jinja South",
    status: "running",
    load: 45.0,
    temp: 35.0,
    uptime: 98.5,
    lastService: "2026-06-27",
    nextService: "2026-09-27",
    runtimeHours: 4300,
    manufacturer: "Konecranes",
    modelNumber: "CXT 5t",
    serialNumber: "KC-CXT5-2020-003300",
    installationDate: "2020-08-30",
    commissioningDate: "2020-09-16",
    powerRating: "15 kW",
    capacity: "5,000 kg SWL",
    speed: "20/5 m/min",
    operatingParameters: "Hoist brake test daily, chain lubrication weekly",
    designLimits: "Max load 5,000 kg, max span 18 m",
    maintenanceProcedures: "Daily hoist brake check. Weekly chain wear inspection. Monthly limit switch test.",
    requiredTools: "Chain gauge, tape measure",
    safetyInstructions: "Inspect sling before lift. Stand clear of load path.",
    spareParts: [
      { partNumber: "SP-CRANE-001", name: "Load chain 10 m", quantity: 1, unit: "pc" },
    ],
    assignedTechnicians: ["Odeke", "Mutebi"],
  },
  {
    id: "CL2-MOTOR-01",
    name: "Motor Installer",
    type: "Powertrain Lift",
    sector: "Chassis Line 2",
    plant: "Jinja South",
    status: "idle",
    load: 0,
    temp: 30.0,
    uptime: 95.4,
    lastService: "2026-06-04",
    nextService: "2026-09-01",
    runtimeHours: 2600,
    manufacturer: "Siemens",
    modelNumber: "SIMOCrane PTI",
    serialNumber: "SI-PTI-2021-006600",
    installationDate: "2021-06-24",
    commissioningDate: "2021-07-04",
    powerRating: "12 kW",
    capacity: "Powertrain up to 600 kg",
    speed: "Variable 0–2 m/min",
    operatingParameters: "Lift axes synchronized ±2 mm, torque reaction arm engaged",
    designLimits: "Max load 800 kg, lift stroke 1,500 mm",
    maintenanceProcedures: "Daily cable inspect. Weekly axis calibration. Monthly brake torque log.",
    requiredTools: "Torque wrench, alignment laser",
    safetyInstructions: "Use load tag line. Verify powertrain lock before release.",
    spareParts: [
      { partNumber: "SP-PT-001", name: "Lifting cable set", quantity: 1, unit: "set" },
    ],
    assignedTechnicians: ["Odeke"],
  },
  {
    id: "CL2-LIFT-01",
    name: "Synchronous Lift Machine",
    type: "Multi-point Lift",
    sector: "Chassis Line 2",
    plant: "Jinja South",
    status: "running",
    load: 58.0,
    temp: 37.5,
    uptime: 97.1,
    lastService: "2026-06-20",
    nextService: "2026-09-20",
    runtimeHours: 3300,
    manufacturer: "Enerpac",
    modelNumber: "Synchronous Lift System",
    serialNumber: "EN-SLS-2021-007700",
    installationDate: "2021-11-11",
    commissioningDate: "2021-11-22",
    powerRating: "30 kW",
    capacity: "4-point 50 T each",
    speed: "0.5 mm/s synchronized",
    operatingParameters: "Level tolerance ±1 mm, pressure per point logged",
    designLimits: "Max total load 200 T, stroke 300 mm",
    maintenanceProcedures: "Daily hose inspection. Weekly cylinder seal check. Monthly pump calibration.",
    requiredTools: "Pressure gauge, laser level",
    safetyInstructions: "Ensure equal load distribution. Use cribbing before hands-under.",
    spareParts: [
      { partNumber: "SP-SL-001", name: "Hydraulic hose set", quantity: 1, unit: "set" },
    ],
    assignedTechnicians: ["Odeke", "Mutebi"],
  },

  // ── QIT ──
  {
    id: "QIT-COMP-01",
    name: "Compressor",
    type: "Piston Compressor",
    sector: "QIT",
    plant: "Jinja South",
    status: "running",
    load: 55.0,
    temp: 47.0,
    pressure: 8.0,
    uptime: 98.9,
    lastService: "2026-06-24",
    nextService: "2026-09-24",
    runtimeHours: 7600,
    manufacturer: "Ingersoll Rand",
    modelNumber: "15T4",
    serialNumber: "IR-15T4-2018-005500",
    installationDate: "2018-12-13",
    commissioningDate: "2018-12-27",
    powerRating: "11 kW",
    capacity: "1.8 m³/min @ 8.5 bar",
    speed: "975 rpm",
    operatingParameters: "Receiver pressure 7.5–8.5 bar, unload cycles logged",
    designLimits: "Max pressure 10 bar, duty cycle 60%",
    maintenanceProcedures: "Daily drain. Weekly belt tension. Monthly valve plate inspect.",
    requiredTools: "Belt tension gauge, valve plate tool",
    safetyInstructions: "Drain receiver before service. Ear protection required.",
    spareParts: [
      { partNumber: "SP-PC-001", name: "Valve plate kit", quantity: 1, unit: "set" },
      { partNumber: "SP-PC-002", name: "V-belt", quantity: 2, unit: "pc" },
    ],
    assignedTechnicians: ["Oumo", "Mutebi"],
  },
  {
    id: "QIT-DRILL-01",
    name: "Drilling Machine",
    type: "Bench Drill",
    sector: "QIT",
    plant: "Jinja South",
    status: "running",
    load: 38.0,
    temp: 32.0,
    uptime: 96.5,
    lastService: "2026-07-10",
    nextService: "2026-10-10",
    runtimeHours: 2100,
    manufacturer: "Bosch",
    modelNumber: "GBM 50-2",
    serialNumber: "BS-GBM50-2022-008800",
    installationDate: "2022-07-22",
    commissioningDate: "2022-07-30",
    powerRating: "1.2 kW",
    capacity: "Ø 25 mm steel",
    speed: "300–2,800 rpm",
    operatingParameters: "Runout ≤ 0.05 mm, chuck key interlock",
    designLimits: "Max drill Ø 32 mm, quill stroke 120 mm",
    maintenanceProcedures: "Daily chuck lubrication. Weekly motor brush check. Monthly bearing listen.",
    requiredTools: "Chuck key, runout dial",
    safetyInstructions: "Secure test fixture. No loose items near chuck.",
    spareParts: [
      { partNumber: "SP-BD-001", name: "Chuck key and arbor", quantity: 2, unit: "set" },
    ],
    assignedTechnicians: ["Mutebi", "Atuhebwa"],
  },
  {
    id: "QIT-TEST-01",
    name: "Test Line Machine",
    type: "End-of-Line Tester",
    sector: "QIT",
    plant: "Jinja South",
    status: "down",
    load: 0,
    temp: 29.0,
    uptime: 92.3,
    lastService: "2026-07-23",
    nextService: "2026-08-22",
    runtimeHours: 1500,
    manufacturer: "Horiba",
    modelNumber: "MEXA-ONE QL-NX",
    serialNumber: "HO-MEXA-2022-009900",
    installationDate: "2023-02-01",
    commissioningDate: "2023-02-16",
    powerRating: "8 kW",
    capacity: "Exhaust + brake combined test",
    speed: "Cycle 8 min/vehicle",
    operatingParameters: "Ambient 15–35°C, calibration gas daily",
    designLimits: "Max vehicle mass 4,000 kg, roller speed 120 km/h",
    maintenanceProcedures: "Daily zero calibration. Weekly filter change. Monthly analyzer drift check.",
    requiredTools: "Calibration gas, filter wrench",
    safetyInstructions: "Rollers must stop before entry. Chock wheels.",
    spareParts: [
      { partNumber: "SP-TEST-001", name: "Analyzer filter", quantity: 6, unit: "pc" },
      { partNumber: "SP-TEST-002", name: "Calibration gas cylinder", quantity: 1, unit: "pc" },
    ],
    assignedTechnicians: ["Mukisa", "Oumo"],
  },
];
hydrateFromStorage("machines", machines);

export const alerts: AlertEvent[] = [
  {
    id: "A-1042",
    timestamp: "2026-08-18T14:02:41Z",
    machineId: "MS-LATHE-01",
    severity: "crit",
    description: "Spindle bearing thermal threshold exceeded (>110°C). Auto-shutdown engaged.",
    acknowledged: false,
  },
  {
    id: "A-1041",
    timestamp: "2026-08-18T13:45:12Z",
    machineId: "MS-MILL-01",
    severity: "warn",
    description: "Coolant pressure variance detected. Deviation: -4.2%.",
    acknowledged: false,
  },
  {
    id: "A-1040",
    timestamp: "2026-08-18T13:18:09Z",
    machineId: "WL-WELD-01",
    severity: "warn",
    description: "Vibration spike on wire feeder (0.08 mm/s). Inspect drive bearing.",
    acknowledged: false,
  },
  {
    id: "A-1039",
    timestamp: "2026-08-18T11:10:05Z",
    machineId: "MS-TUBE-01",
    severity: "info",
    description: "Routine calibration cycle completed. Offset adjusted.",
    acknowledged: true,
  },
  {
    id: "A-1038",
    timestamp: "2026-08-18T09:42:00Z",
    machineId: "PS-SPRAY-01",
    severity: "info",
    description: "Booth airflow nominal. Filter differential within range.",
    acknowledged: true,
  },
  {
    id: "A-1037",
    timestamp: "2026-08-18T08:30:00Z",
    machineId: "CL2-SLING-01",
    severity: "info",
    description: "Shift change logged. Operator 07 session initiated.",
    acknowledged: true,
  },
  {
    id: "A-1036",
    timestamp: "2026-08-17T22:14:55Z",
    machineId: "QIT-TEST-01",
    severity: "crit",
    description: "End-of-line tester offline. Analyzer fault code F-221.",
    acknowledged: true,
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: "WO-2041",
    title: "Replace spindle bearing — emergency",
    machineId: "MS-LATHE-01",
    status: "in_progress",
    priority: "emergency",
    type: "corrective",
    assignee: "Mukisa",
    department: "Electrical Maintenance",
    referenceNumber: "KMC-WO-001",
    createdAt: "2026-08-17T14:05:00Z",
    dueAt: "2026-08-19T20:00:00Z",
    problemDescription: "Spindle bearing thermal threshold exceeded (>110°C). Auto-shutdown engaged. Abnormal noise observed.",
    tasks: [
      { description: "Inspect cooling system (fan and vents)", completed: true },
      { description: "Remove damaged spindle bearing (Type 7208)", completed: false },
      { description: "Install new bearing and verify runout", completed: false },
      { description: "Test run and verify temperature < 90°C", completed: false },
    ],
    schedule: {
      startDate: "2026-08-17T14:05:00Z",
      expectedCompletion: "2026-08-19T20:00:00Z",
    },
    resources: {
      tools: ["Bearing puller set", "Torque wrench", "Dial indicator"],
      spareParts: ["Spindle bearing 7208 (×4)", "High-temp grease"],
      ppe: ["Heat-resistant gloves", "Safety goggles", "Face shield"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-08-17T14:30:00Z",
    },
  },
  {
    id: "WO-2040",
    title: "Investigate coolant pressure deviation",
    machineId: "MS-MILL-01",
    status: "open",
    priority: "urgent",
    type: "corrective",
    assignee: "Suubi",
    department: "Mechanical Maintenance",
    referenceNumber: "KMC-WO-002",
    createdAt: "2026-08-16T13:50:00Z",
    dueAt: "2026-08-21T17:00:00Z",
    problemDescription: "Coolant pressure variance detected. Deviation: -4.2%. Potential leak in supply line.",
    tasks: [
      { description: "Inspect coolant supply line for leaks" },
      { description: "Check coolant pump impeller condition" },
      { description: "Pressure-test cooling circuit" },
      { description: "Top up coolant and verify flow rate" },
    ],
    schedule: {
      startDate: "2026-08-19T08:00:00Z",
      expectedCompletion: "2026-08-21T17:00:00Z",
    },
    resources: {
      tools: ["Pressure gauge", "Coolant test kit"],
      spareParts: ["Coolant pump seal", "Hose clamp set"],
      ppe: ["Chemical gloves", "Safety goggles"],
    },
    authorizedBy: "Nakimbugwe",
  },
  {
    id: "WO-2039",
    title: "Inspect wire feeder vibration",
    machineId: "WL-WELD-01",
    status: "open",
    priority: "normal",
    type: "preventive",
    assignee: "Wagoli",
    department: "Predictive Maintenance",
    referenceNumber: "KMC-WO-003",
    createdAt: "2026-08-16T13:25:00Z",
    dueAt: "2026-08-24T17:00:00Z",
    problemDescription: "Vibration spike on wire feeder (0.08 mm/s). Exceeds baseline by 60%.",
    tasks: [
      { description: "Acquire vibration spectrum on feeder" },
      { description: "Inspect drive bearing and preload" },
      { description: "Check coupling alignment" },
      { description: "Lubricate and re-test" },
    ],
    schedule: {
      startDate: "2026-08-23T08:00:00Z",
      expectedCompletion: "2026-08-24T14:00:00Z",
    },
    resources: {
      tools: ["Vibration analyzer", "Strobe light"],
      spareParts: ["Bearing grease cartridge"],
      ppe: ["Safety goggles"],
    },
    authorizedBy: "Nakimbugwe",
  },
  {
    id: "WO-2038",
    title: "Shear quarterly PM",
    machineId: "MS-SHEAR-01",
    status: "in_progress",
    priority: "normal",
    type: "preventive",
    assignee: "Odeke",
    department: "Mechanical Maintenance",
    referenceNumber: "KMC-WO-004",
    createdAt: "2026-08-16T08:00:00Z",
    dueAt: "2026-08-20T18:00:00Z",
    problemDescription: "Scheduled quarterly preventive maintenance per OEM checklist.",
    tasks: [
      { description: "Check blade gap and rake", completed: true },
      { description: "Inspect hold-down pads", completed: true },
      { description: "Replace hydraulic filter", completed: false },
      { description: "Record alignment certificate", completed: false },
    ],
    schedule: {
      startDate: "2026-08-16T08:00:00Z",
      expectedCompletion: "2026-08-20T18:00:00Z",
    },
    resources: {
      tools: ["Feeler gauge", "Filter wrench", "Dial indicator"],
      spareParts: ["Hydraulic filter element", "Blade shim set"],
      ppe: ["Cut-resistant gloves", "Safety boots"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-08-16T08:15:00Z",
    },
  },
  {
    id: "WO-2037",
    title: "Paint compressor filter replacement",
    machineId: "PS-COMP-01",
    status: "open",
    priority: "low",
    type: "preventive",
    assignee: "Oumo",
    department: "Instrumentation & Control",
    referenceNumber: "KMC-WO-005",
    createdAt: "2026-08-14T10:00:00Z",
    dueAt: "2026-08-26T17:00:00Z",
    tasks: [
      { description: "Isolate and drain compressor" },
      { description: "Remove old filter element and inspect" },
      { description: "Install new filter and o-rings" },
      { description: "Refill, reset, and leak-test" },
    ],
    schedule: {
      startDate: "2026-08-26T08:00:00Z",
      expectedCompletion: "2026-08-26T12:00:00Z",
    },
    resources: {
      tools: ["Filter wrench", "Drain pan"],
      spareParts: ["Filter element HF-110", "O-ring kit"],
      ppe: ["Chemical gloves", "Safety goggles"],
    },
    authorizedBy: "Nakimbugwe",
  },
  {
    id: "WO-2036",
    title: "Overhead sling brake inspection",
    machineId: "CL2-SLING-01",
    status: "blocked",
    priority: "low",
    type: "condition-based",
    assignee: "Tabalaata",
    department: "Workshop & Fabrication",
    referenceNumber: "KMC-WO-006",
    createdAt: "2026-08-13T14:00:00Z",
    dueAt: "2026-08-25T17:00:00Z",
    problemDescription: "Brake slip detected during high-load lift. Tag-out required pending inspection.",
    tasks: [
      { description: "Measure brake torque" },
      { description: "Inspect hoist chain wear" },
      { description: "Adjust or replace brake pads" },
      { description: "Load test to SWL and record" },
    ],
    schedule: {
      startDate: "2026-08-25T08:00:00Z",
      expectedCompletion: "2026-08-25T14:00:00Z",
    },
    resources: {
      tools: ["Brake torque tester", "Chain gauge"],
      spareParts: ["Brake pad kit", "Chain lubricant"],
      ppe: ["Safety gloves", "Hard hat"],
    },
    authorizedBy: "Nakimbugwe",
  },
  {
    id: "WO-2035",
    title: "Laser tube calibration",
    machineId: "MS-TUBE-01",
    status: "done",
    priority: "low",
    type: "predictive",
    assignee: "Suubi",
    department: "Mechanical Maintenance",
    referenceNumber: "KMC-WO-007",
    createdAt: "2026-08-12T09:00:00Z",
    dueAt: "2026-08-16T11:00:00Z",
    problemDescription: "Predictive calibration based on kerf-width trend observed over last 90 days.",
    tasks: [
      { description: "Baseline cut measurement", completed: true },
      { description: "Adjust focal offset", completed: true },
      { description: "Verify nozzle alignment", completed: true },
      { description: "Record calibration certificate", completed: true },
    ],
    schedule: {
      startDate: "2026-08-16T08:00:00Z",
      expectedCompletion: "2026-08-16T11:00:00Z",
      actualStart: "2026-08-16T08:00:00Z",
      actualCompletion: "2026-08-16T10:45:00Z",
    },
    resources: {
      tools: ["Micrometer", "Alignment jig"],
      spareParts: ["Nozzle kit"],
      ppe: ["Safety goggles"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-08-16T08:00:00Z",
      actualCompletionTime: "2026-08-16T10:45:00Z",
      partsUsed: "Nozzle kit",
      observations: "Kerf width corrected from +0.12 mm to +0.02 mm.",
      rootCause: "Nozzle wear",
    },
  },
];
hydrateFromStorage("workOrders", workOrders);

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return daysFromNow(-n);
}

let pmLogSeq = 0;
function pmLog(
  taskId: string,
  completedBy: string,
  daysBeforeNow: number,
  durationHours: number,
  okCount: number,
  faultyCount: number,
  remarks?: string,
): PMCompletionLog {
  const items = buildPMChecklist().map((item, i) => ({
    ...item,
    result: (i < okCount ? "ok" : i < okCount + faultyCount ? "faulty" : "na") as PMChecklistItem["result"],
  }));
  const completedAt = daysAgo(daysBeforeNow);
  return {
    id: `pmlog-${taskId}-${++pmLogSeq}`,
    completedAt: `${completedAt}T14:00:00.000Z`,
    completedBy,
    startTime: `${completedAt}T${String(10).padStart(2, "0")}:00:00.000Z`,
    endTime: `${completedAt}T${String(10 + Math.floor(durationHours)).padStart(2, "0")}:${String(Math.round((durationHours % 1) * 60)).padStart(2, "0")}:00.000Z`,
    durationHours,
    items,
    remarks,
  };
}

/** The 9 originally curated PM tasks — rich narrative content, kept as-is and extended with checklist/history. */
const curatedPMTasks: PMTask[] = [
  { id: "PM-01", referenceNumber: "KMC/DPD/2026/CL201", machineId: "MS-TUBE-01", task: "Lens and nozzle inspection", intervalDays: 30, lastDone: "2026-08-02", nextDue: "2026-09-01", frequency: "monthly", procedures: "Inspect lens for burn marks. Check nozzle concentricity. Replace if kerf > 0.1 mm.", requiredTools: "Lens wipes, nozzle gauge", safetyInstructions: "Disable laser source. Wait 5 min after shutdown.", personInCharge: "Wagoli", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-01", "Wagoli", 45, 2.5, 19, 1, "Nozzle showed early wear, replaced.")] },
  { id: "PM-02", referenceNumber: "KMC/DPD/2026/CL202", machineId: "MS-LATHE-01", task: "Spindle lubrication", intervalDays: 14, lastDone: "2026-08-06", nextDue: "2026-08-20", frequency: "weekly", procedures: "Apply grease to spindle bearings (2 pumps). Check oil mist level.", requiredTools: "Grease gun, lint-free cloth", safetyInstructions: "Spindle must be at rest. Lockout before access.", personInCharge: "Mukisa", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-02", "Mukisa", 60, 1.2, 20, 0), pmLog("PM-02", "Mukisa", 74, 1.4, 20, 0)] },
  { id: "PM-03", referenceNumber: "KMC/DPD/2026/CL203", machineId: "MS-MILL-01", task: "Coolant flush", intervalDays: 60, lastDone: "2026-06-17", nextDue: "2026-08-16", frequency: "monthly", procedures: "Drain old coolant. Flush tank with clean water. Refill with 5% concentrate mix.", requiredTools: "Drain pan, pH test kit", safetyInstructions: "Wear chemical-resistant gloves and goggles.", personInCharge: "Suubi", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-03", "Suubi", 90, 2.8, 18, 2, "Tank had heavier sediment than usual.")] },
  { id: "PM-04", referenceNumber: "KMC/DPD/2026/CL204", machineId: "WL-WELD-01", task: "Torch tip and liner check", intervalDays: 21, lastDone: "2026-08-06", nextDue: "2026-08-27", frequency: "weekly", procedures: "Remove worn tip. Clean threads. Install new tip. Verify gas flow.", requiredTools: "Tip wrench, wire brush", safetyInstructions: "Purge gas lines before disassembly.", personInCharge: "Tabalaata", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-04", "Tabalaata", 28, 1.6, 20, 0)] },
  { id: "PM-05", referenceNumber: "KMC/DPD/2026/CL205", machineId: "PS-SPRAY-01", task: "Paint pattern verification", intervalDays: 14, lastDone: "2026-08-06", nextDue: "2026-08-20", frequency: "weekly", procedures: "Run pattern test card. Check atomization. Record fan width.", requiredTools: "Pattern test card, calipers", safetyInstructions: "Use booth ventilation. Ground applicator.", personInCharge: "Wagoli", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-05", "Wagoli", 21, 1.1, 20, 0)] },
  { id: "PM-06", referenceNumber: "KMC/DPD/2026/CL206", machineId: "PS-COMP-01", task: "Filter and oil check", intervalDays: 30, lastDone: "2026-08-07", nextDue: "2026-09-06", frequency: "monthly", procedures: "Replace oil filter. Check air filter. Sample oil for analysis.", requiredTools: "Filter wrench, sample bottle", safetyInstructions: "Depressurize receiver. Wear ear protection.", personInCharge: "Oumo", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-06", "Oumo", 38, 2.2, 20, 0), pmLog("PM-06", "Oumo", 68, 2.0, 19, 1)] },
  { id: "PM-07", referenceNumber: "KMC/DPD/2026/CL207", machineId: "CL2-SLING-01", task: "Hoist brake and chain inspection", intervalDays: 30, lastDone: "2026-07-23", nextDue: "2026-08-22", frequency: "monthly", procedures: "Test brake slip. Measure chain wear. Record load test.", requiredTools: "Chain gauge, load cell", safetyInstructions: "Tag out before entry. Use fall protection if elevated.", personInCharge: "Odeke", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-07", "Odeke", 53, 3.1, 20, 0)] },
  { id: "PM-08", referenceNumber: "KMC/DPD/2026/CL208", machineId: "QIT-TEST-01", task: "Analyzer drift check", intervalDays: 14, lastDone: "2026-08-06", nextDue: "2026-08-20", frequency: "weekly", procedures: "Run calibration gas. Verify zero and span. Replace filter if differential > limit.", requiredTools: "Calibration gas, filter wrench", safetyInstructions: "Rollers locked. Chock vehicle.", personInCharge: "Oumo", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-08", "Oumo", 21, 0.9, 20, 0)] },
  { id: "PM-09", referenceNumber: "KMC/DPD/2026/CL209", machineId: "CL1-VIN-01", task: "Stylus and vision calibration", intervalDays: 60, lastDone: "2026-07-13", nextDue: "2026-09-11", frequency: "monthly", procedures: "Replace worn stylus. Verify engraving depth. Calibrate vision camera.", requiredTools: "Stylus kit, depth gauge, calibration plaque", safetyInstructions: "Lock marking head. Wear eye protection.", personInCharge: "Mukisa", scheduledBy: "Nakimbugwe", visitStatus: "open", checklist: buildPMChecklist(), history: [pmLog("PM-09", "Mukisa", 66, 2.4, 20, 0)] },
];

/** Remaining fleet machines that had no PM coverage — generated from the standard checklist template. */
const generatedPMTasks: PMTask[] = [
  { id: "PM-10", machineId: "MS-DRILL-01", task: "Pillar drill preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Mukisa", daysDue: -6, hist: [["Mukisa", 40, 1.8, 20, 0]], procedures: "Check chuck runout. Inspect belt tension and pulley alignment. Verify quill feed and depth stop.", requiredTools: "Dial indicator, belt tension gauge, chuck key", safetyInstructions: "Lock out power before belt/chuck work. Secure workpiece before drilling." },
  { id: "PM-11", machineId: "MS-BEND-01", task: "Press brake preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Suubi", daysDue: 3, hist: [["Suubi", 27, 2.1, 19, 1]], procedures: "Check hydraulic fluid level and pressure. Inspect ram alignment and back-gauge calibration. Test safety light curtain.", requiredTools: "Pressure gauge, feeler gauge, dial indicator", safetyInstructions: "Verify light curtain trips before use. Keep hands clear of die area." },
  { id: "PM-12", machineId: "MS-SHEAR-01", task: "Hydraulic shear preventive inspection", frequency: "quarterly", intervalDays: 90, personInCharge: "Wagoli", daysDue: 12, hist: [["Wagoli", 78, 3.2, 20, 0]], procedures: "Inspect blade clearance and sharpness. Check hydraulic hoses for leaks. Test hold-down clamps and foot switch guard.", requiredTools: "Blade gap gauge, hydraulic pressure gauge", safetyInstructions: "Lockout before blade adjustment. Keep hands clear of cutting line." },
  { id: "PM-13", machineId: "WL-SIDE-01", task: "Panel former preventive inspection", frequency: "weekly", intervalDays: 14, personInCharge: "Tabalaata", daysDue: -2, hist: [["Tabalaata", 12, 1.4, 20, 0]], procedures: "Check die alignment and clamp pressure. Inspect roller surfaces for wear. Verify pneumatic clamp cycle.", requiredTools: "Feeler gauge, pneumatic pressure gauge", safetyInstructions: "Lockout during die change. Keep hands clear of forming rollers." },
  { id: "PM-14", machineId: "WL-UHOOP-01", task: "Roll former preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Tabalaata", daysDue: 9, hist: [["Tabalaata", 34, 2.0, 20, 0]], procedures: "Inspect roll stations for wear and alignment. Check drive chain tension. Lubricate bearings per schedule.", requiredTools: "Alignment laser, chain tension gauge, grease gun", safetyInstructions: "Lockout before roll adjustment. Keep loose clothing clear of rollers." },
  { id: "PM-15", machineId: "WL-MERGE-01", task: "Assembly fixture preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Mutebi", daysDue: 20, hist: [], procedures: "Check locating pin wear and fixture clamp force. Verify fixture-to-fixture repeatability. Inspect quick-change tooling.", requiredTools: "Pin gauge, torque wrench", safetyInstructions: "Lockout before fixture adjustment. Support fixture before removing clamps." },
  { id: "PM-16", machineId: "PS-POLY-01", task: "PU dispenser preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Wagoli", daysDue: -1, hist: [["Wagoli", 32, 2.3, 18, 2]], procedures: "Check mix-head ratio calibration. Inspect metering pump seals. Purge and clean dispense lines.", requiredTools: "Calibration cups, seal kit, torque wrench", safetyInstructions: "Wear chemical-resistant gloves and respirator. Ventilate area before purge." },
  { id: "PM-17", machineId: "TS-COMP-01", task: "Compressor preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Oumo", daysDue: 6, hist: [["Oumo", 29, 1.9, 20, 0]], procedures: "Replace oil and air filters. Check belt tension. Drain moisture from receiver tank.", requiredTools: "Filter wrench, belt tension gauge", safetyInstructions: "Depressurize receiver before service. Wear ear protection near intake." },
  { id: "PM-18", machineId: "CL2-MOTOR-01", task: "Powertrain lift preventive inspection", frequency: "quarterly", intervalDays: 90, personInCharge: "Odeke", daysDue: 35, hist: [["Odeke", 55, 2.9, 20, 0]], procedures: "Test lift brake holding force. Inspect lifting chains/cables for wear. Verify overload sensor calibration.", requiredTools: "Torque wrench, chain gauge, load cell", safetyInstructions: "Tag out before entry. Verify powertrain lock before release." },
  { id: "PM-19", machineId: "CL2-LIFT-01", task: "Multi-point lift preventive inspection", frequency: "quarterly", intervalDays: 90, personInCharge: "Odeke", daysDue: -14, hist: [["Odeke", 100, 3.4, 19, 1]], procedures: "Check synchronization across all lift points. Inspect hydraulic cylinders for leaks. Test emergency lowering system.", requiredTools: "Pressure gauge, laser level", safetyInstructions: "Ensure equal load distribution. Use cribbing before working underneath." },
  { id: "PM-20", machineId: "QIT-COMP-01", task: "Compressor preventive inspection", frequency: "monthly", intervalDays: 30, personInCharge: "Oumo", daysDue: 15, hist: [["Oumo", 20, 2.1, 20, 0]], procedures: "Replace oil and air filters. Check belt tension. Drain moisture from receiver tank.", requiredTools: "Filter wrench, belt tension gauge", safetyInstructions: "Depressurize receiver before service. Wear ear protection near intake." },
  { id: "PM-21", machineId: "QIT-DRILL-01", task: "Bench drill preventive inspection", frequency: "weekly", intervalDays: 14, personInCharge: "Mukisa", daysDue: 4, hist: [["Mukisa", 9, 1.0, 20, 0]], procedures: "Check chuck runout. Inspect belt tension and pulley alignment. Verify quill feed and depth stop.", requiredTools: "Dial indicator, belt tension gauge, chuck key", safetyInstructions: "Lock out power before belt/chuck work. Secure workpiece before drilling." },
].map(({ id, machineId, task, frequency, intervalDays, personInCharge, daysDue, hist, procedures, requiredTools, safetyInstructions }) => ({
  id,
  referenceNumber: nextRefFor(id),
  machineId,
  task,
  intervalDays,
  frequency: frequency as PMFrequency,
  nextDue: daysFromNow(daysDue),
  lastDone: daysAgo(intervalDays - daysDue),
  personInCharge,
  scheduledBy: "Nakimbugwe",
  procedures,
  requiredTools,
  safetyInstructions,
  visitStatus: "open" as WorkOrderStatus,
  checklist: buildPMChecklist(),
  history: hist.map(([who, daysBefore, hours, ok, faulty]) =>
    pmLog(id, who as string, daysBefore as number, hours as number, ok as number, faulty as number),
  ),
}));

function nextRefFor(id: string): string {
  const seq = 200 + Number(id.slice(3));
  return `KMC/DPD/2026/CL${seq}`;
}

export const pmTasks: PMTask[] = [...curatedPMTasks, ...generatedPMTasks];
hydrateFromStorage("pmTasks", pmTasks);

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
    maintenance: "Maintenance",
  }[status];
}

export function woTypeLabel(type: WorkOrderType): string {
  return {
    corrective: "Corrective",
    preventive: "Preventive",
    predictive: "Predictive",
    "condition-based": "Condition-based",
  }[type];
}

export function woStatusLabel(status: WorkOrderStatus): string {
  return {
    open: "Open",
    in_progress: "In Progress",
    blocked: "Blocked",
    done: "Done",
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

export function addMachine(machine: Machine) {
  machines.unshift(machine);
  persistToStorage("machines", machines);
}

export function updateMachine(id: string, updates: Partial<Machine>) {
  const idx = machines.findIndex((m) => m.id === id);
  if (idx !== -1) {
    machines[idx] = { ...machines[idx], ...updates };
    persistToStorage("machines", machines);
  }
}
