import { useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import {
  purchaseOrders,
  materialDraws,
  materialReturns,
  inventory,
  POStatus,
} from "@/data/materials";

const poStatusFilters: { key: POStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "overdue", label: "Overdue" },
];

export default function MaterialControl() {
  const [poFilter, setPoFilter] = useState<POStatus | "all">("all");

  const filteredPOs = useMemo(() => {
    if (poFilter === "all") return purchaseOrders;
    return purchaseOrders.filter((p) => p.status === poFilter);
  }, [poFilter]);

  const openPOs = purchaseOrders.filter((p) => p.status === "open").length;
  const overduePOs = purchaseOrders.filter((p) => p.status === "overdue").length;
  const totalPOValue = purchaseOrders.reduce((s, p) => s + p.costUSD, 0);

  return (
    <AppLayout pageTitle="Material Control" breadcrumb="PURCHASE & INVENTORY">
      <div className="flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Open POs" value={openPOs} />
          <Kpi label="Overdue POs" value={overduePOs} tone="crit" />
          <Kpi label="Total PO Value" value={`$${totalPOValue.toLocaleString()}`} />
          <Kpi label="Inventory Items" value={inventory.length} />
        </div>

        {/* Purchase Orders */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <SectionHeading>Purchase Orders ({filteredPOs.length})</SectionHeading>
            <div className="flex flex-wrap gap-1">
              {poStatusFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setPoFilter(f.key)}
                  className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                    poFilter === f.key
                      ? "border-foreground bg-panel-elevated text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                  <th className="p-3 w-24">PO ID</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 w-32">Supplier</th>
                  <th className="p-3 w-16">Qty</th>
                  <th className="p-3 w-20 text-right">Cost</th>
                  <th className="p-3 w-24">Ordered</th>
                  <th className="p-3 w-24">Deadline</th>
                  <th className="p-3 w-20">Status</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-bold">{po.id}</td>
                    <td className="p-3">{po.item}</td>
                    <td className="p-3 text-muted-foreground">{po.supplier}</td>
                    <td className="p-3">{po.qty} {po.unit}</td>
                    <td className="p-3 text-right">${po.costUSD}</td>
                    <td className="p-3 text-muted-foreground">{po.orderDate}</td>
                    <td className="p-3">{po.deliveryDeadline}</td>
                    <td className="p-3">
                      <POStatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Material Draws */}
        <div>
          <SectionHeading>Material Draws ({materialDraws.length})</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                  <th className="p-3 w-20">ID</th>
                  <th className="p-3 w-28">Date</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 w-16">Qty</th>
                  <th className="p-3 w-28">Drawn By</th>
                  <th className="p-3 w-24">WO / Machine</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {materialDraws.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-bold">{d.id}</td>
                    <td className="p-3 text-muted-foreground">{d.date}</td>
                    <td className="p-3">{d.item}</td>
                    <td className="p-3">{d.qty} {d.unit}</td>
                    <td className="p-3 text-muted-foreground">{d.drawnBy}</td>
                    <td className="p-3 text-muted-foreground">{d.workOrderId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Returns */}
        <div>
          <SectionHeading>Return Material Report ({materialReturns.length})</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                  <th className="p-3 w-20">ID</th>
                  <th className="p-3 w-28">Date</th>
                  <th className="p-3">Item</th>
                  <th className="p-3 w-16">Qty</th>
                  <th className="p-3 w-28">Returned By</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {materialReturns.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-bold">{r.id}</td>
                    <td className="p-3 text-muted-foreground">{r.date}</td>
                    <td className="p-3">{r.item}</td>
                    <td className="p-3">{r.qty} {r.unit}</td>
                    <td className="p-3 text-muted-foreground">{r.returnedBy}</td>
                    <td className="p-3">{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Inventory Status */}
        <div>
          <SectionHeading>Materials Status / Inventory</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const levelColor =
                item.status === "critical"
                  ? "text-led-crit"
                  : item.status === "low"
                  ? "text-led-warn"
                  : "text-led-ok";
              return (
                <Panel key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                      {item.partNumber}
                    </span>
                    <span className={`font-mono-data text-[10px] uppercase ${levelColor}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="flex justify-between mt-3 font-mono-data text-xs">
                    <span className="text-muted-foreground">Stock: {item.qtyOnHand} {item.unit}</span>
                    <span className="text-muted-foreground">Min: {item.minStock}</span>
                  </div>
                  <p className="font-mono-data text-[10px] text-muted-foreground mt-1">{item.location}</p>
                </Panel>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function POStatusBadge({ status }: { status: POStatus }) {
  const cls =
    status === "open"
      ? "text-foreground"
      : status === "closed"
      ? "text-led-ok"
      : "text-led-crit";
  return <span className={`font-mono-data text-[10px] uppercase ${cls}`}>{status}</span>;
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" | "crit" }) {
  const colorClass =
    tone === "crit"
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : tone === "ok"
      ? "text-led-ok"
      : "text-foreground";
  return (
    <Panel className="p-5 h-24 flex flex-col justify-between bg-gradient-blue">
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-mono-data text-3xl font-bold ${colorClass}`}>{value}</span>
    </Panel>
  );
}
