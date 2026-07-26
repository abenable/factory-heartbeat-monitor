export interface FileDoc {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "docx" | "image";
  size: string;
  updatedAt: string;
}

export const recentFiles: FileDoc[] = [
  { id: "F-01", name: "PM_Q2_2026_schedule.pdf", type: "pdf", size: "1.2 MB", updatedAt: "2026-05-05T09:00:00Z" },
  { id: "F-02", name: "WO_cost_report_May.xlsx", type: "xlsx", size: "245 KB", updatedAt: "2026-05-04T16:30:00Z" },
  { id: "F-03", name: "LATH-AX-09_overhaul_photos.zip", type: "image", size: "8.4 MB", updatedAt: "2026-05-03T11:15:00Z" },
  { id: "F-04", name: "Safety_briefing_0506.docx", type: "docx", size: "56 KB", updatedAt: "2026-05-02T08:00:00Z" },
];
