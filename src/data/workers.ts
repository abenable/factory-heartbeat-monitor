export interface WorkerPerformance {
  completed: number;
  avgDays: number;
  availability: number;
  quality: number;
  safety: number;
  monthly: number[];
}

export interface WorkerProfile {
  username: string;
  name: string;
  jobTitle: string;
  workerId: string;
  department: string;
  license: string;
  licenseExpiry: string;
  joined: string;
  shift: string;
  phone: string;
  email: string;
  certifications: string[];
  /** Workforce role used to route the user to the right interface. */
  role?: "supervisor" | "technician" | "viewer" | "reporter";
  /** Supervisor-only performance metrics. */
  performance?: WorkerPerformance;
}

// All workers share the same demo password: "Angel"
export const WORKERS: Record<string, WorkerProfile> = {
  Suubi: {
    username: "Suubi",
    name: "Suubi Agatha",
    jobTitle: "Senior Maintenance Engineer",
    workerId: "23/U/1442",
    department: "Mechanical Maintenance",
    license: "Mechanical Engineer · ERB-UG-2451",
    licenseExpiry: "2027-04-30",
    joined: "2018-02-12",
    shift: "Day · 06:00 – 14:00",
    phone: "+256 772 100 001",
    email: "suubi@kiiramotors.com",
    certifications: ["ISO 55001 Asset Mgmt", "Vibration Analysis Cat II"],
    role: "supervisor",
    performance: { completed: 12, avgDays: 2.1, availability: 96, quality: 94, safety: 100, monthly: [10, 12, 11, 14, 12, 12] },
  },
  Mukisa: {
    username: "Mukisa",
    name: "Mukisa Elisha Kisitu",
    jobTitle: "Electrical Technician",
    workerId: "23/U/0415",
    department: "Electrical Maintenance",
    license: "Electrical Installer · ERA-Class-B-8821",
    licenseExpiry: "2026-09-15",
    joined: "2020-06-01",
    shift: "Day · 06:00 – 14:00",
    phone: "+256 772 100 002",
    email: "mukisa@kiiramotors.com",
    certifications: ["LV/HV Switching", "PLC Siemens S7"],
    performance: { completed: 14, avgDays: 1.8, availability: 92, quality: 96, safety: 98, monthly: [12, 13, 14, 15, 14, 14] },
  },
  Ahaisibwe: {
    username: "Ahaisibwe",
    name: "Ahaisibwe Joseline",
    jobTitle: "Reliability Engineer",
    workerId: "23/U/0119",
    department: "Reliability & RCA",
    license: "Mechanical Engineer · ERB-UG-3120",
    licenseExpiry: "2028-01-20",
    joined: "2019-09-09",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 003",
    email: "ahaisibwe@kiiramotors.com",
    certifications: ["CMRP", "Root Cause Analysis Lvl 3"],
    role: "supervisor",
    performance: { completed: 9, avgDays: 2.8, availability: 95, quality: 97, safety: 100, monthly: [7, 8, 9, 8, 10, 9] },
  },
  Odeke: {
    username: "Odeke",
    name: "Odeke Isaac",
    jobTitle: "Mechanical Fitter",
    workerId: "23/U/1289",
    department: "Mechanical Maintenance",
    license: "Trade Test I · DIT-MF-1102",
    licenseExpiry: "2027-03-31",
    joined: "2017-04-18",
    shift: "Night · 22:00 – 06:00",
    phone: "+256 772 100 004",
    email: "odeke@kiiramotors.com",
    certifications: ["Confined Space Entry", "Rigging & Slinging"],
    performance: { completed: 16, avgDays: 2.5, availability: 94, quality: 92, safety: 96, monthly: [13, 14, 15, 16, 16, 16] },
  },
  Oumo: {
    username: "Oumo",
    name: "Oumo Benjamin",
    jobTitle: "Instrumentation Technician",
    workerId: "21/U/1522",
    department: "Instrumentation & Control",
    license: "Instrumentation · UNBS-IC-441",
    licenseExpiry: "2027-07-10",
    joined: "2021-01-25",
    shift: "Swing · 14:00 – 22:00",
    phone: "+256 772 100 005",
    email: "oumo@kiiramotors.com",
    certifications: ["HART Field Comm", "Loop Tuning"],
    performance: { completed: 11, avgDays: 2.0, availability: 90, quality: 95, safety: 100, monthly: [10, 11, 10, 12, 11, 11] },
  },
  Ahereza: {
    username: "Ahereza",
    name: "Ahereza Sheba",
    jobTitle: "Maintenance Planner",
    workerId: "23/U/0124",
    department: "Planning & Scheduling",
    license: "Industrial Engineer · ERB-UG-5012",
    licenseExpiry: "2028-11-05",
    joined: "2022-03-14",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 006",
    email: "ahereza@kiiramotors.com",
    certifications: ["SAP PM Power User", "Lean Six Sigma Green Belt"],
    role: "supervisor",
    performance: { completed: 8, avgDays: 3.2, availability: 98, quality: 93, safety: 100, monthly: [6, 8, 7, 8, 9, 8] },
  },
  Owembabazi: {
    username: "Owembabazi",
    name: "Owembabazi Danellah",
    jobTitle: "HSE & Maintenance Officer",
    workerId: "23/U/1338",
    department: "Health, Safety & Environment",
    license: "OSH Practitioner · MGLSD-OSH-219",
    licenseExpiry: "2026-12-01",
    joined: "2019-05-20",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 007",
    email: "owembabazi@kiiramotors.com",
    certifications: ["NEBOSH IGC", "First Aid Lvl 3"],
    role: "supervisor",
    performance: { completed: 6, avgDays: 3.5, availability: 97, quality: 95, safety: 100, monthly: [5, 6, 6, 7, 6, 6] },
  },
  Nakimbugwe: {
    username: "Nakimbugwe",
    name: "Nakimbugwe Angel",
    jobTitle: "Maintenance Supervisor",
    workerId: "23/U/13755/PS",
    department: "Operations Maintenance",
    license: "Mechanical Engineer · ERB-UG-2210",
    licenseExpiry: "2027-08-22",
    joined: "2016-11-03",
    shift: "Day · 06:00 – 14:00",
    phone: "+256 772 100 008",
    email: "nakimbugwe@kiiramotors.com",
    certifications: ["CMMS Admin", "ISO 45001 Lead Auditor"],
    role: "supervisor",
    performance: { completed: 10, avgDays: 2.3, availability: 95, quality: 94, safety: 98, monthly: [8, 9, 10, 10, 11, 10] },
  },
  Tabalaata: {
    username: "Tabalaata",
    name: "Tabalaata Allan",
    jobTitle: "Welder & Fabricator",
    workerId: "23/U/1445",
    department: "Workshop & Fabrication",
    license: "Welder Class I · DIT-WF-0907",
    licenseExpiry: "2027-05-30",
    joined: "2015-08-12",
    shift: "Day · 07:00 – 16:00",
    phone: "+256 772 100 009",
    email: "tabalaata@kiiramotors.com",
    certifications: ["AWS D1.1 SMAW", "Hot Work Permit Issuer"],
    performance: { completed: 13, avgDays: 2.6, availability: 93, quality: 91, safety: 94, monthly: [11, 12, 13, 13, 13, 13] },
  },
  Wagoli: {
    username: "Wagoli",
    name: "Wagoli John Bosco",
    jobTitle: "Lubrication Technician",
    workerId: "23/U/1516",
    department: "Predictive Maintenance",
    license: "Lube Tech II · ICML-MLT-1108",
    licenseExpiry: "2027-02-14",
    joined: "2020-10-01",
    shift: "Swing · 14:00 – 22:00",
    phone: "+256 772 100 010",
    email: "wagoli@kiiramotors.com",
    certifications: ["MLT-I", "Oil Analysis Interpretation"],
    performance: { completed: 15, avgDays: 1.9, availability: 95, quality: 95, safety: 100, monthly: [12, 13, 14, 15, 15, 15] },
  },
  Mutebi: {
    username: "Mutebi",
    name: "Mutebi Ibrahim",
    jobTitle: "Apprentice Technician",
    workerId: "23/U/0897",
    department: "Mechanical Maintenance",
    license: "Apprenticeship · DIT-APP-2301",
    licenseExpiry: "2027-08-15",
    joined: "2024-01-15",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 011",
    email: "mutebi@kiiramotors.com",
    certifications: ["Basic Electrical Safety"],
    performance: { completed: 7, avgDays: 4.1, availability: 88, quality: 89, safety: 96, monthly: [4, 5, 6, 7, 7, 7] },
  },
  Tumusiime: {
    username: "Tumusiime",
    name: "Tumusiime Edmund",
    jobTitle: "Shareholder · Read-only Viewer",
    workerId: "ALMA/SH/001",
    department: "Board & Shareholders",
    license: "N/A · Non-operational role",
    licenseExpiry: "—",
    joined: "2015-01-10",
    shift: "Off-site · By appointment",
    phone: "+256 772 100 012",
    email: "edmund.tumusiime@kiiramotors.com",
    certifications: ["Board Member"],
    role: "viewer",
  },
  Atuhebwa: {
    username: "Atuhebwa",
    name: "Atuhebwa Mable",
    jobTitle: "Trainee Technician",
    workerId: "24/U/0210",
    department: "Workforce Pool",
    license: "Pending Trade Test · DIT-APP-2410",
    licenseExpiry: "2027-01-01",
    joined: "2026-02-01",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 013",
    email: "atuhebwa@kiiramotors.com",
    certifications: ["Workshop Safety Induction"],
    performance: { completed: 5, avgDays: 4.5, availability: 90, quality: 88, safety: 95, monthly: [3, 4, 4, 5, 5, 5] },
  },
  Sserwada: {
    username: "Sserwada",
    name: "Sserwada Mike",
    jobTitle: "Trainee Technician",
    workerId: "24/U/0211",
    department: "Workforce Pool",
    license: "Pending Trade Test · DIT-APP-2411",
    licenseExpiry: "2027-01-01",
    joined: "2026-02-01",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 014",
    email: "sserwada@kiiramotors.com",
    certifications: ["Workshop Safety Induction"],
    performance: { completed: 4, avgDays: 5.0, availability: 89, quality: 87, safety: 94, monthly: [2, 3, 3, 4, 4, 4] },
  },
  Asiimwe: {
    username: "Asiimwe",
    name: "Asiimwe Ritah",
    jobTitle: "Production Line Operator",
    workerId: "24/U/0212",
    department: "Production Line",
    license: "N/A · Operational reporting role",
    licenseExpiry: "—",
    joined: "2026-02-01",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 015",
    email: "asiimwe@kiiramotors.com",
    certifications: ["Production Safety Induction"],
    role: "reporter",
  },
};

export function getWorker(username: string | null): WorkerProfile | null {
  if (!username) return null;
  return WORKERS[username] ?? null;
}

export const ALLOWED_USERNAMES = Object.keys(WORKERS);

/** Technicians currently on leave (demo data). Used by supervisor dashboards. */
export const onLeaveUsernames = ["Oumo", "Mutebi"];
