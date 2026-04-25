// Material Control & Purchase data

export type POStatus = "open" | "closed" | "overdue";

export interface PurchaseOrder {
  id: string;
  supplier: string;
  item: string;
  qty: number;
  unit: string;
  status: POStatus;
  orderDate: string;
  deliveryDeadline: string;
  receivedQty?: number;
  costUSD: number;
}

export interface MaterialDraw {
  id: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  drawnBy: string;
  workOrderId?: string;
  machineId?: string;
}

export interface MaterialReturn {
  id: string;
  date: string;
  item: string;
  qty: number;
  unit: string;
  returnedBy: string;
  reason: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  partNumber: string;
  qtyOnHand: number;
  unit: string;
  minStock: number;
  location: string;
  status: "ok" | "low" | "critical";
}

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO-2026-041", supplier: "Hydraulics UG Ltd", item: "Hydraulic seal kit (STAMP-PR-01)", qty: 4, unit: "set", status: "open", orderDate: "2026-04-10", deliveryDeadline: "2026-04-30", costUSD: 320 },
  { id: "PO-2026-042", supplier: "Bearing World", item: "Spindle bearing 7208", qty: 10, unit: "pc", status: "open", orderDate: "2026-04-15", deliveryDeadline: "2026-04-28", costUSD: 450 },
  { id: "PO-2026-043", supplier: "Siemens Parts", item: "Conveyor drive belt B-section", qty: 20, unit: "m", status: "closed", orderDate: "2026-03-20", deliveryDeadline: "2026-04-05", receivedQty: 20, costUSD: 180 },
  { id: "PO-2026-044", supplier: "Coolant Solutions", item: "Coolant concentrate (20L)", qty: 6, unit: "drum", status: "overdue", orderDate: "2026-03-28", deliveryDeadline: "2026-04-10", costUSD: 540 },
  { id: "PO-2026-045", supplier: "LubeTech Supplies", item: "High-temp bearing grease", qty: 12, unit: "cartridge", status: "open", orderDate: "2026-04-18", deliveryDeadline: "2026-05-05", costUSD: 96 },
  { id: "PO-2026-046", supplier: "FilterMax", item: "Hydraulic filter HF-220", qty: 8, unit: "pc", status: "open", orderDate: "2026-04-20", deliveryDeadline: "2026-05-02", costUSD: 120 },
];

export const materialDraws: MaterialDraw[] = [
  { id: "MD-041", date: "2026-04-24", item: "Spindle bearing 7208", qty: 4, unit: "pc", drawnBy: "Mukisa", workOrderId: "WO-2041", machineId: "LATH-AX-09" },
  { id: "MD-042", date: "2026-04-23", item: "Hydraulic filter HF-220", qty: 1, unit: "pc", drawnBy: "Odeke", workOrderId: "WO-2038", machineId: "INJ-MD-11" },
  { id: "MD-043", date: "2026-04-22", item: "Coolant pump seal", qty: 2, unit: "pc", drawnBy: "Suubi", workOrderId: "WO-2040", machineId: "MILL-CN-04" },
  { id: "MD-044", date: "2026-04-21", item: "Conveyor roller bearing 6205", qty: 4, unit: "pc", drawnBy: "Odeke", workOrderId: "WO-2036", machineId: "CONV-MN-02" },
];

export const materialReturns: MaterialReturn[] = [
  { id: "MR-011", date: "2026-04-20", item: "Bearing grease cartridge", qty: 2, unit: "pc", returnedBy: "Wagoli", reason: "Wrong spec — needed high-temp grade" },
  { id: "MR-012", date: "2026-04-18", item: "O-ring kit (metric)", qty: 1, unit: "set", returnedBy: "Ouma", reason: "Excess from WO-2037" },
];

export const inventory: InventoryItem[] = [
  { id: "INV-001", name: "Hydraulic seal kit", partNumber: "SP-HP-001", qtyOnHand: 2, unit: "set", minStock: 2, location: "Store A-12", status: "ok" },
  { id: "INV-002", name: "Spindle bearing 7208", partNumber: "SP-CNC-003", qtyOnHand: 6, unit: "pc", minStock: 4, location: "Store B-03", status: "ok" },
  { id: "INV-003", name: "Conveyor drive belt B-section", partNumber: "SP-CV-002", qtyOnHand: 1, unit: "m", minStock: 5, location: "Store C-08", status: "critical" },
  { id: "INV-004", name: "Coolant concentrate (20L)", partNumber: "SP-CNC-015", qtyOnHand: 3, unit: "drum", minStock: 4, location: "Store A-04", status: "low" },
  { id: "INV-005", name: "Hydraulic filter HF-220", partNumber: "SP-INJ-002", qtyOnHand: 5, unit: "pc", minStock: 3, location: "Store B-07", status: "ok" },
  { id: "INV-006", name: "High-temp bearing grease", partNumber: "SP-LUB-001", qtyOnHand: 3, unit: "cartridge", minStock: 6, location: "Store A-09", status: "low" },
];

export function getInventoryStatus(item: InventoryItem): InventoryItem["status"] {
  if (item.qtyOnHand <= item.minStock * 0.5) return "critical";
  if (item.qtyOnHand <= item.minStock) return "low";
  return "ok";
}
