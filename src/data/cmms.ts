// Shared mock data for the CMMS. Replace with real telemetry source later.

export type MachineStatus = "running" | "idle" | "down" | "maintenance";

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

  // ── 1. Asset Identification ──
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;

  // ── 2. Location & Installation ──
  plant?: string;
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
export type WorkOrderPriority = "low" | "medium" | "high" | "critical";
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
}

export interface WorkOrder {
  id: string;
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
}

export interface PMTask {
  id: string;
  machineId: string;
  task: string;
  intervalDays: number;
  lastDone: string;
  nextDue: string;
  frequency?: "daily" | "weekly" | "monthly" | "quarterly";
  procedures?: string;
  requiredTools?: string;
  safetyInstructions?: string;
  personInCharge?: string; // worker username
}

export let machines: Machine[] = [
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
    lastService: "2026-01-25",
    nextService: "2026-04-25",
    runtimeHours: 4218,
    manufacturer: "Komatsu Industries",
    modelNumber: "HPF-4000-X",
    serialNumber: "KI-HP-2019-004412",
    installationDate: "2019-03-15",
    commissioningDate: "2019-04-10",
    powerRating: "75 kW",
    capacity: "4,000 kN",
    speed: "14 strokes/min",
    operatingParameters: "Pressure 3800–4500 PSI, Temp ≤ 60°C",
    designLimits: "Max pressure 5,200 PSI, Max temp 85°C",
    maintenanceProcedures: "Daily oil-level check. Weekly filter inspection. Monthly ram alignment.",
    requiredTools: "Hydraulic gauge set, torque wrench, dial indicator",
    safetyInstructions: "Lockout-tagout required. Wear face shield during pressure tests.",
    spareParts: [
      { partNumber: "SP-HP-001", name: "Hydraulic seal kit", quantity: 2, unit: "set" },
      { partNumber: "SP-HP-007", name: "Pressure relief valve", quantity: 1, unit: "pc" },
    ],
    assignedTechnicians: ["Suubi", "Odeke"],
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
    lastService: "2026-01-15",
    nextService: "2026-04-15",
    runtimeHours: 6122,
    manufacturer: "DMG Mori",
    modelNumber: "NTX 3000",
    serialNumber: "DMG-NTX-2018-002891",
    installationDate: "2018-08-20",
    commissioningDate: "2018-09-12",
    powerRating: "45 kW",
    capacity: "Ø 300 mm × 1,500 mm",
    speed: "12,000 rpm max",
    operatingParameters: "Spindle temp ≤ 90°C, coolant flow ≥ 15 L/min",
    designLimits: "Max spindle 14,000 rpm, Max temp 120°C",
    maintenanceProcedures: "Daily chip conveyor clean. Weekly coolant pH test. Monthly ball-screw grease.",
    requiredTools: "Bore gauge, RPM tachometer, coolant test kit",
    safetyInstructions: "Ensure spindle stop before door open. Eye protection mandatory.",
    spareParts: [
      { partNumber: "SP-CNC-003", name: "Spindle bearing (7208)", quantity: 4, unit: "pc" },
      { partNumber: "SP-CNC-011", name: "Coolant pump seal", quantity: 2, unit: "pc" },
    ],
    assignedTechnicians: ["Mukisa", "Oumo"],
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
    lastService: "2026-02-01",
    nextService: "2026-05-01",
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
    lastService: "2026-02-10",
    nextService: "2026-05-10",
    runtimeHours: 8900,
    manufacturer: "Siemens Logistics",
    modelNumber: "CV-1500-HE",
    serialNumber: "SL-CV-2020-007331",
    installationDate: "2020-01-10",
    commissioningDate: "2020-02-05",
    powerRating: "11 kW",
    capacity: "1,500 kg/h",
    speed: "0.8 m/s",
    operatingParameters: "Belt tension 2.5–3.0 kN, Vibration ≤ 0.05 mm/s",
    maintenanceProcedures: "Daily belt-walk inspection. Weekly roller noise check. Monthly tension calibration.",
    requiredTools: "Belt tension gauge, vibration meter, strobe light",
    safetyInstructions: "Lock conveyor before entry. No loose clothing near drive rollers.",
    spareParts: [
      { partNumber: "SP-CV-002", name: "Drive belt (B-section)", quantity: 3, unit: "m" },
      { partNumber: "SP-CV-005", name: "Roller bearing 6205", quantity: 8, unit: "pc" },
    ],
    assignedTechnicians: ["Odeke", "Tabalaata"],
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
    lastService: "2025-12-22",
    nextService: "2026-03-22",
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
    lastService: "2026-01-22",
    nextService: "2026-04-22",
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
    lastService: "2026-02-05",
    nextService: "2026-05-05",
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
    lastService: "2026-01-10",
    nextService: "2026-04-10",
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
    lastService: "2026-02-18",
    nextService: "2026-05-18",
    runtimeHours: 2980,
  },
];

export const alerts: AlertEvent[] = [
  {
    id: "A-1042",
    timestamp: "2026-04-24T14:02:41Z",
    machineId: "LATH-AX-09",
    severity: "crit",
    description: "Spindle bearing thermal threshold exceeded (>110°C). Auto-shutdown engaged.",
    acknowledged: false,
  },
  {
    id: "A-1041",
    timestamp: "2026-04-24T13:45:12Z",
    machineId: "MILL-CN-04",
    severity: "warn",
    description: "Coolant pressure variance detected. Deviation: -4.2%.",
    acknowledged: false,
  },
  {
    id: "A-1040",
    timestamp: "2026-04-24T13:18:09Z",
    machineId: "WELD-RB-06",
    severity: "warn",
    description: "Vibration spike on axis Z (0.08 mm/s). Inspect spindle bearing.",
    acknowledged: false,
  },
  {
    id: "A-1039",
    timestamp: "2026-04-24T11:10:05Z",
    machineId: "STAMP-PR-01",
    severity: "info",
    description: "Routine calibration cycle completed successfully. Offset adjusted.",
    acknowledged: true,
  },
  {
    id: "A-1038",
    timestamp: "2026-04-24T09:42:00Z",
    machineId: "OVEN-CR-08",
    severity: "info",
    description: "Setpoint reached 185°C. Cure cycle nominal.",
    acknowledged: true,
  },
  {
    id: "A-1037",
    timestamp: "2026-04-24T08:30:00Z",
    machineId: "CONV-MN-02",
    severity: "info",
    description: "Shift change logged. Operator 04 session initiated.",
    acknowledged: true,
  },
  {
    id: "A-1036",
    timestamp: "2026-04-23T22:14:55Z",
    machineId: "INJ-MD-11",
    severity: "warn",
    description: "Hydraulic pressure dropped below 2800 PSI. Operator paused machine.",
    acknowledged: true,
  },
  {
    id: "A-1035",
    timestamp: "2026-04-23T18:02:18Z",
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
    type: "corrective",
    assignee: "Mukisa",
    department: "Electrical Maintenance",
    createdAt: "2026-04-24T14:05:00Z",
    dueAt: "2026-04-24T20:00:00Z",
    problemDescription: "Spindle bearing thermal threshold exceeded (>110°C). Auto-shutdown engaged. Abnormal noise observed.",
    tasks: [
      { description: "Inspect cooling system (fan and vents)", completed: true },
      { description: "Remove damaged spindle bearing (Type 7208)", completed: false },
      { description: "Install new bearing and verify runout", completed: false },
      { description: "Test run and verify temperature < 90°C", completed: false },
    ],
    schedule: {
      startDate: "2026-04-24T14:05:00Z",
      expectedCompletion: "2026-04-24T20:00:00Z",
    },
    resources: {
      tools: ["Bearing puller set", "Torque wrench", "Dial indicator"],
      spareParts: ["Spindle bearing 7208 (×4)", "High-temp grease"],
      ppe: ["Heat-resistant gloves", "Safety goggles", "Face shield"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-04-24T14:30:00Z",
    },
  },
  {
    id: "WO-2040",
    title: "Investigate coolant pressure deviation",
    machineId: "MILL-CN-04",
    status: "open",
    priority: "high",
    type: "corrective",
    assignee: "Suubi",
    department: "Mechanical Maintenance",
    createdAt: "2026-04-24T13:50:00Z",
    dueAt: "2026-04-25T17:00:00Z",
    problemDescription: "Coolant pressure variance detected. Deviation: -4.2%. Potential leak in supply line.",
    tasks: [
      { description: "Inspect coolant supply line for leaks" },
      { description: "Check coolant pump impeller condition" },
      { description: "Pressure-test cooling circuit" },
      { description: "Top up coolant and verify flow rate" },
    ],
    schedule: {
      startDate: "2026-04-25T08:00:00Z",
      expectedCompletion: "2026-04-25T17:00:00Z",
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
    title: "Inspect Z-axis vibration",
    machineId: "WELD-RB-06",
    status: "open",
    priority: "medium",
    type: "preventive",
    assignee: "Wagoli",
    department: "Predictive Maintenance",
    createdAt: "2026-04-24T13:25:00Z",
    dueAt: "2026-04-26T17:00:00Z",
    problemDescription: "Vibration spike on axis Z (0.08 mm/s). Exceeds baseline by 60%.",
    tasks: [
      { description: "Acquire vibration spectrum on Z-axis" },
      { description: "Inspect spindle bearing and preload" },
      { description: "Check coupling alignment" },
      { description: "Lubricate and re-test" },
    ],
    schedule: {
      startDate: "2026-04-26T08:00:00Z",
      expectedCompletion: "2026-04-26T14:00:00Z",
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
    title: "Quarterly PM — Injection Molder 11",
    machineId: "INJ-MD-11",
    status: "in_progress",
    priority: "medium",
    type: "preventive",
    assignee: "Odeke",
    department: "Mechanical Maintenance",
    createdAt: "2026-04-23T08:00:00Z",
    dueAt: "2026-04-24T18:00:00Z",
    problemDescription: "Scheduled quarterly preventive maintenance per OEM checklist.",
    tasks: [
      { description: "Replace hydraulic filter element", completed: true },
      { description: "Check heater band resistance", completed: true },
      { description: "Calibrate shot-size settings", completed: false },
      { description: "Verify clamp force", completed: false },
    ],
    schedule: {
      startDate: "2026-04-23T08:00:00Z",
      expectedCompletion: "2026-04-24T18:00:00Z",
    },
    resources: {
      tools: ["Multimeter", "Torque wrench", "Calipers"],
      spareParts: ["Hydraulic filter (Type HF-220)", "Heater band (ø 60 mm)"],
      ppe: ["Heat-resistant gloves", "Safety boots"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-04-23T08:15:00Z",
    },
  },
  {
    id: "WO-2037",
    title: "Replace hydraulic filter",
    machineId: "PUMP-HY-03",
    status: "open",
    priority: "low",
    type: "preventive",
    assignee: "Oumo",
    department: "Instrumentation & Control",
    createdAt: "2026-04-22T10:00:00Z",
    dueAt: "2026-04-29T17:00:00Z",
    tasks: [
      { description: "Isolate and drain hydraulic reservoir" },
      { description: "Remove old filter element and inspect" },
      { description: "Install new filter and o-rings" },
      { description: "Refill, bleed, and leak-test" },
    ],
    schedule: {
      startDate: "2026-04-29T08:00:00Z",
      expectedCompletion: "2026-04-29T12:00:00Z",
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
    title: "Belt tension calibration",
    machineId: "CONV-MN-02",
    status: "blocked",
    priority: "low",
    type: "condition-based",
    assignee: "Tabalaata",
    department: "Workshop & Fabrication",
    createdAt: "2026-04-21T14:00:00Z",
    dueAt: "2026-04-28T17:00:00Z",
    problemDescription: "Belt slippage detected during high-load shifts. Tension gauge reads 2.1 kN (target 2.5–3.0 kN).",
    tasks: [
      { description: "Measure belt tension across all spans" },
      { description: "Adjust tensioner and re-measure" },
      { description: "Inspect drive pulley for wear" },
      { description: "Run 30-min load test and record vibration" },
    ],
    schedule: {
      startDate: "2026-04-28T08:00:00Z",
      expectedCompletion: "2026-04-28T14:00:00Z",
    },
    resources: {
      tools: ["Belt tension gauge", "Vibration meter"],
      spareParts: ["Tensioner spring", "Drive belt (B-section, 5 m)"],
      ppe: ["Safety gloves", "Hard hat"],
    },
    authorizedBy: "Nakimbugwe",
  },
  {
    id: "WO-2035",
    title: "Calibration cycle — Press T5",
    machineId: "STAMP-PR-01",
    status: "done",
    priority: "low",
    type: "predictive",
    assignee: "Suubi",
    department: "Mechanical Maintenance",
    createdAt: "2026-04-20T09:00:00Z",
    dueAt: "2026-04-24T11:00:00Z",
    problemDescription: "Predictive calibration based on force-drift trend observed over last 90 days.",
    tasks: [
      { description: "Baseline force measurement", completed: true },
      { description: "Adjust hydraulic pressure offset", completed: true },
      { description: "Verify stroke timing", completed: true },
      { description: "Record calibration certificate", completed: true },
    ],
    schedule: {
      startDate: "2026-04-24T08:00:00Z",
      expectedCompletion: "2026-04-24T11:00:00Z",
      actualStart: "2026-04-24T08:00:00Z",
      actualCompletion: "2026-04-24T10:45:00Z",
    },
    resources: {
      tools: ["Force transducer", "Digital caliper"],
      spareParts: ["Calibration shim set"],
      ppe: ["Safety goggles"],
    },
    authorizedBy: "Nakimbugwe",
    workLog: {
      actualStartTime: "2026-04-24T08:00:00Z",
      actualCompletionTime: "2026-04-24T10:45:00Z",
      partsUsed: "Calibration shim set",
      observations: "Force drift corrected from +1.8% to +0.1%.",
      rootCause: "Hydraulic compensator wear",
    },
  },
];

export const pmTasks: PMTask[] = [
  { id: "PM-01", machineId: "STAMP-PR-01", task: "Hydraulic fluid check", intervalDays: 30, lastDone: "2026-03-25", nextDue: "2026-04-24", frequency: "monthly", procedures: "Check reservoir level. Inspect for leaks. Top up if < 80%.", requiredTools: "Dipstick, inspection lamp", safetyInstructions: "Ensure press is de-energized. Wear safety gloves.", personInCharge: "Wagoli" },
  { id: "PM-02", machineId: "LATH-AX-09", task: "Spindle lubrication", intervalDays: 14, lastDone: "2026-04-10", nextDue: "2026-04-24", frequency: "weekly", procedures: "Apply grease to spindle bearings (2 pumps). Check oil mist level.", requiredTools: "Grease gun, lint-free cloth", safetyInstructions: "Spindle must be at rest. Lockout before access.", personInCharge: "Mukisa" },
  { id: "PM-03", machineId: "MILL-CN-04", task: "Coolant flush", intervalDays: 60, lastDone: "2026-02-24", nextDue: "2026-04-25", frequency: "monthly", procedures: "Drain old coolant. Flush tank with clean water. Refill with 5% concentrate mix.", requiredTools: "Drain pan, pH test kit", safetyInstructions: "Wear chemical-resistant gloves and goggles.", personInCharge: "Suubi" },
  { id: "PM-04", machineId: "CONV-MN-02", task: "Belt tension inspection", intervalDays: 45, lastDone: "2026-03-10", nextDue: "2026-04-24", frequency: "monthly", procedures: "Measure belt tension across all spans. Adjust tensioner if < 2.5 kN. Inspect for cracks.", requiredTools: "Belt tension gauge, flashlight", safetyInstructions: "Lockout conveyor before entry.", personInCharge: "Odeke" },
  { id: "PM-05", machineId: "WELD-RB-06", task: "Torch tip replacement", intervalDays: 21, lastDone: "2026-04-03", nextDue: "2026-04-24", frequency: "weekly", procedures: "Remove worn tip. Clean threads. Install new tip. Verify gas flow.", requiredTools: "Tip wrench, wire brush", safetyInstructions: "Purge gas lines before disassembly.", personInCharge: "Tabalaata" },
  { id: "PM-06", machineId: "INJ-MD-11", task: "Quarterly overhaul", intervalDays: 90, lastDone: "2026-01-24", nextDue: "2026-04-24", frequency: "quarterly", procedures: "Replace hydraulic filter. Check heater bands. Calibrate shot size. Verify clamp force.", requiredTools: "Filter wrench, multimeter, calipers", safetyInstructions: "Depressurize hydraulic system. Allow heaters to cool.", personInCharge: "Odeke" },
  { id: "PM-07", machineId: "PUMP-HY-03", task: "Filter replacement", intervalDays: 30, lastDone: "2026-03-25", nextDue: "2026-04-24", frequency: "monthly", procedures: "Isolate pump. Drain reservoir. Remove filter housing. Replace element and o-rings. Refill.", requiredTools: "Filter wrench, drain pan", safetyInstructions: "Lockout pump motor. Wear chemical gloves.", personInCharge: "Oumo" },
  { id: "PM-08", machineId: "OVEN-CR-08", task: "Heating element calibration", intervalDays: 60, lastDone: "2026-02-24", nextDue: "2026-04-25", frequency: "monthly", procedures: "Verify setpoint vs actual temperature at 3 zones. Adjust PID offsets. Record drift.", requiredTools: "Thermocouple calibrator", safetyInstructions: "Allow oven to cool to < 50°C before entry.", personInCharge: "Oumo" },
  { id: "PM-09", machineId: "GRND-SF-12", task: "Wheel balance check", intervalDays: 30, lastDone: "2026-03-25", nextDue: "2026-04-24", frequency: "monthly", procedures: "Remove grinding wheel. Check balance on stand. Dress wheel face. Reinstall and verify runout.", requiredTools: "Wheel dresser, dial indicator", safetyInstructions: "Wear face shield during dressing. Check flange tightness.", personInCharge: "Suubi" },
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
}

export function updateMachine(id: string, updates: Partial<Machine>) {
  const idx = machines.findIndex((m) => m.id === id);
  if (idx !== -1) {
    machines[idx] = { ...machines[idx], ...updates };
  }
}
