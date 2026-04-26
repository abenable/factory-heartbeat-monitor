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
  /** Viewers can browse the CMMS but cannot create, edit or delete records.
   *  They may still update their own contact details on their profile. */
  viewer?: boolean;
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
    email: "suubi@group6.co.ug",
    certifications: ["ISO 55001 Asset Mgmt", "Vibration Analysis Cat II"],
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
    email: "mukisa@group6.co.ug",
    certifications: ["LV/HV Switching", "PLC Siemens S7"],
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
    email: "ahaisibwe@group6.co.ug",
    certifications: ["CMRP", "Root Cause Analysis Lvl 3"],
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
    email: "odeke@group6.co.ug",
    certifications: ["Confined Space Entry", "Rigging & Slinging"],
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
    email: "oumo@group6.co.ug",
    certifications: ["HART Field Comm", "Loop Tuning"],
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
    email: "ahereza@group6.co.ug",
    certifications: ["SAP PM Power User", "Lean Six Sigma Green Belt"],
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
    email: "owembabazi@group6.co.ug",
    certifications: ["NEBOSH IGC", "First Aid Lvl 3"],
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
    email: "nakimbugwe@group6.co.ug",
    certifications: ["CMMS Admin", "ISO 45001 Lead Auditor"],
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
    email: "tabalaata@group6.co.ug",
    certifications: ["AWS D1.1 SMAW", "Hot Work Permit Issuer"],
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
    email: "wagoli@group6.co.ug",
    certifications: ["MLT-I", "Oil Analysis Interpretation"],
  },
  Mutebi: {
    username: "Mutebi",
    name: "Mutebi Ibrahim",
    jobTitle: "Apprentice Technician",
    workerId: "23/U/0897",
    department: "Mechanical Maintenance",
    license: "Apprenticeship · DIT-APP-2301",
    licenseExpiry: "2026-08-15",
    joined: "2024-01-15",
    shift: "Day · 08:00 – 17:00",
    phone: "+256 772 100 011",
    email: "mutebi@alma.co.ug",
    certifications: ["Basic Electrical Safety"],
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
    email: "edmund.tumusiime@alma.co.ug",
    certifications: ["Board Member"],
    viewer: true,
  },
};

export function getWorker(username: string | null): WorkerProfile | null {
  if (!username) return null;
  return WORKERS[username] ?? null;
}

export const ALLOWED_USERNAMES = Object.keys(WORKERS);
