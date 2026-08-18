import { WORKERS } from "@/data/workers";
import type { WorkerProfile } from "@/data/workers";
import { hydrateFromStorage, persistToStorage } from "@/lib/persistedStore";

export type MaintenanceUrgency = "critical" | "high" | "medium" | "low";
export type MaintenanceRequestStatus = "submitted" | "approved" | "rejected" | "converted";

export interface MaintenanceRequestApproval {
  supervisorName: string;
  supervisorUsername: string;
  supervisorDepartment: string;
  /** Typed name used as the supervisor's soft-copy signature; the printed form always leaves the line blank for a physical signature. */
  signatureName: string;
  approvedAt: string;
}

export interface MaintenanceRequestResponse {
  receivedAt: string;
  workOrderIssuedAt?: string;
  workOrderNumber?: string;
  firstResponseAt?: string;
}

export interface MaintenanceRequest {
  /** Internal unique id, equal to jobNumber. */
  id: string;
  /** Immutable job number: KMC-MRF-YEAR-SEQ */
  jobNumber: string;
  status: MaintenanceRequestStatus;
  submittedAt: string;
  submittedBy: string;

  // ── Requester ──
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  requesterDesignation: string;
  requestDateTime: string;
  /** Typed name used as the requester's soft-copy signature; the printed form always leaves the line blank for a physical signature. */
  requesterSignatureName: string;
  requesterSignedAt?: string;

  // ── Equipment ──
  equipmentName: string;
  equipmentId: string;
  workshop: string;
  station: string;
  operatorCustodianName: string;
  operatorCustodianDesignation: string;

  // ── Issue ──
  problemDescription: string;

  // ── Urgency (single choice, order fixed on form) ──
  urgency: MaintenanceUrgency;

  // ── Approval ──
  approval?: MaintenanceRequestApproval;

  // ── Response tracking ──
  response: MaintenanceRequestResponse;

  // ── Routing (set on submit) ──
  routedSupervisorUsername: string;
}

export const URGENCY_ORDER: { value: MaintenanceUrgency; label: string; hint: string }[] = [
  { value: "critical", label: "Critical", hint: "Production Halted" },
  { value: "high", label: "High", hint: "Risk of Breakdown" },
  { value: "medium", label: "Medium", hint: "Scheduled Repair" },
  { value: "low", label: "Low", hint: "Minor Issue" },
];

export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: "KMC-MRF-2026-0001",
    jobNumber: "KMC-MRF-2026-0001",
    status: "approved",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    submittedBy: "Asiimwe",
    requesterName: "Asiimwe Ritah",
    requesterEmail: "asiimwe@kiiramotors.com",
    requesterDepartment: "Production Line",
    requesterDesignation: "Production Line Operator",
    requestDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    requesterSignatureName: "Ritah",
    requesterSignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    equipmentName: "Hydraulic Press T5",
    equipmentId: "STAMP-PR-01",
    workshop: "Press Shop",
    station: "Station 3",
    operatorCustodianName: "Asiimwe Ritah",
    operatorCustodianDesignation: "Production Line Operator",
    problemDescription:
      "Unusual knocking sound from hydraulic press during Auto cycle. Noise increases under full load and appears to originate from the main ram guide bushes.",
    urgency: "high",
    response: {
      receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
      firstResponseAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
      workOrderIssuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000).toISOString(),
      workOrderNumber: "WO-2091",
    },
    routedSupervisorUsername: "Nakimbugwe",
    approval: {
      supervisorName: "Nakimbugwe Angel",
      supervisorUsername: "Nakimbugwe",
      supervisorDepartment: "Operations Maintenance",
      signatureName: "Nakimbugwe",
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 28 * 60 * 1000).toISOString(),
    },
  },
];
hydrateFromStorage("maintenanceRequests", maintenanceRequests);

export function getMaintenanceRequest(id: string): MaintenanceRequest | undefined {
  return maintenanceRequests.find((r) => r.id === id);
}

export function addMaintenanceRequest(req: MaintenanceRequest) {
  maintenanceRequests.unshift(req);
  persistToStorage("maintenanceRequests", maintenanceRequests);
}

export function updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>) {
  const idx = maintenanceRequests.findIndex((r) => r.id === id);
  if (idx !== -1) {
    maintenanceRequests[idx] = { ...maintenanceRequests[idx], ...updates };
    persistToStorage("maintenanceRequests", maintenanceRequests);
  }
}

export function nextMaintenanceJobNumber(year = new Date().getFullYear()): string {
  const prefix = `KMC-MRF-${year}-`;
  const seqs = maintenanceRequests
    .filter((r) => r.jobNumber.startsWith(prefix))
    .map((r) => {
      const tail = r.jobNumber.slice(prefix.length);
      const n = Number(tail);
      return Number.isNaN(n) ? 0 : n;
    });
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function urgencyLabel(u: MaintenanceUrgency): string {
  return URGENCY_ORDER.find((o) => o.value === u)?.label ?? u;
}

export function urgencyHint(u: MaintenanceUrgency): string {
  return URGENCY_ORDER.find((o) => o.value === u)?.hint ?? "";
}

/** Route to the supervisor responsible for the requester's department/workshop. */
export function routeSupervisorForDepartment(department: string): WorkerProfile | null {
  const supervisors = Object.values(WORKERS).filter((w) => w.role === "supervisor");
  const exact = supervisors.find((s) => s.department.toLowerCase() === department.toLowerCase());
  if (exact) return exact;
  const contains = supervisors.find(
    (s) =>
      s.department.toLowerCase().includes(department.toLowerCase()) ||
      department.toLowerCase().includes(s.department.toLowerCase()),
  );
  if (contains) return contains;
  // Fallback to Operations Maintenance supervisor for production/workshop requests.
  return supervisors.find((s) => s.department === "Operations Maintenance") ?? supervisors[0] ?? null;
}

export function canApproveRequest(user: WorkerProfile | null, req: MaintenanceRequest): boolean {
  if (!user || user.role !== "supervisor") return false;
  if (user.username === req.routedSupervisorUsername) return true;
  if (user.department.toLowerCase() === req.requesterDepartment.toLowerCase()) return true;
  if (req.approval?.supervisorDepartment && user.department.toLowerCase() === req.approval.supervisorDepartment.toLowerCase()) return true;
  return false;
}

export function formatDurationMs(ms: number): string {
  if (ms < 0) return "—";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}d ${hr % 24}h ${min % 60}m`;
  if (hr > 0) return `${hr}h ${min % 60}m`;
  return `${min}m ${sec % 60}s`;
}

export function timeToFirstResponse(req: MaintenanceRequest): string {
  if (!req.response.receivedAt) return "—";
  const first =
    req.response.firstResponseAt ??
    req.approval?.approvedAt ??
    req.response.workOrderIssuedAt;
  if (!first) return "Pending";
  return formatDurationMs(new Date(first).getTime() - new Date(req.response.receivedAt).getTime());
}
