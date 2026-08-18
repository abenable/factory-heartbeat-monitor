import { hydrateFromStorage, persistToStorage } from "@/lib/persistedStore";

export type JobRequestStatus = "new" | "assigned" | "in_progress" | "converted";

export interface JobRequest {
  id: string;
  requestedAt: string; // ISO
  requester: string;
  description: string;
  equipmentId: string;
  equipmentName: string;
  status: JobRequestStatus;
  priority: "normal" | "urgent";
  plant: string;
  /** Optional photos attached by the line worker. */
  images?: string[];
}

export const jobRequests: JobRequest[] = [
  {
    id: "JR-1042",
    requestedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    requester: "Shift Operator A",
    description: "Unusual knocking sound from hydraulic press during Auto cycle.",
    equipmentId: "STAMP-PR-01",
    equipmentName: "Hydraulic Press T5",
    status: "new",
    priority: "urgent",
    plant: "Jinja North",
  },
  {
    id: "JR-1041",
    requestedAt: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
    requester: "Line Lead B",
    description: "CNC lathe throwing ERR-THR-9 intermittently after warmup.",
    equipmentId: "LATH-AX-09",
    equipmentName: "Multi-Axis CNC",
    status: "assigned",
    priority: "urgent",
    plant: "Jinja North",
  },
  {
    id: "JR-1040",
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    requester: "Fabrication Lead",
    description: "Robotic welder torch tip wear causing bead inconsistency.",
    equipmentId: "WELD-RB-06",
    equipmentName: "Robotic Welder",
    status: "in_progress",
    priority: "normal",
    plant: "Jinja South",
  },
  {
    id: "JR-1039",
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    requester: "Assembly Operator",
    description: "Main conveyor belt slippage under high-load shifts.",
    equipmentId: "CONV-MN-02",
    equipmentName: "Main Conveyor",
    status: "converted",
    priority: "normal",
    plant: "Jinja South",
  },
  {
    id: "JR-1038",
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    requester: "Utilities Tech",
    description: "Hydraulic pump 3 pressure fluctuating ±200 PSI.",
    equipmentId: "PUMP-HY-03",
    equipmentName: "Hydraulic Pump 3",
    status: "new",
    priority: "normal",
    plant: "Jinja North",
  },
];
hydrateFromStorage("jobRequests", jobRequests);

export function addJobRequest(jr: JobRequest) {
  jobRequests.unshift(jr);
  persistToStorage("jobRequests", jobRequests);
}

export function updateJobRequest(id: string, updates: Partial<JobRequest>) {
  const idx = jobRequests.findIndex((j) => j.id === id);
  if (idx !== -1) {
    jobRequests[idx] = { ...jobRequests[idx], ...updates };
    persistToStorage("jobRequests", jobRequests);
  }
}
