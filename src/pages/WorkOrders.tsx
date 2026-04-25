import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import {
  workOrders as initial,
  WorkOrderStatus,
  WorkOrderPriority,
  getMachine,
} from "@/data/cmms";
import { printSingleWorkOrder } from "@/components/PrintableWorkOrder";

const statusFilters: { key: WorkOrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

const priorityColor: Record<WorkOrderPriority, string> = {
  critical: "text-led-crit",
  high: "text-led-warn",
  medium: "text-foreground",
  low: "text-muted-foreground",
};

const WorkOrders = () => {
  const [filter, setFilter] = useState<WorkOrderStatus | "all">("all");
  const list = useMemo(
    () =>
      filter === "all" ? initial : initial.filter((w) => w.status === filter),
    [filter],
  );

  const open = initial.filter((w) => w.status === "open").length;
  const inProgress = initial.filter((w) => w.status === "in_progress").length;
  const blocked = initial.filter((w) => w.status === "blocked").length;
  const done = initial.filter((w) => w.status === "done").length;

  const printFiltered = () => window.print();

  return (
    <AppLayout pageTitle="Work Orders" breadcrumb="MAINTENANCE QUEUE">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <Stat label="Open" value={open} />
          <Stat label="In Progress" value={inProgress} />
          <Stat label="Blocked" value={blocked} tone="warn" />
          <Stat label="Completed" value={done} tone="ok" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                  filter === f.key
                    ? "border-foreground bg-panel-elevated text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/work-orders/new">
                <Plus className="size-4" />
                New Work Order
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={printFiltered}>
              <Printer className="size-4" />
              Print Filtered ({list.length})
            </Button>
          </div>
        </div>

        <SectionHeading>{list.length} Work Orders</SectionHeading>
        <Panel className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                <th className="p-3 w-24">ID</th>
                <th className="p-3">Title</th>
                <th className="p-3 w-32">Node</th>
                <th className="p-3 w-24">Priority</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3 w-32">Assignee</th>
                <th className="p-3 w-32">Due</th>
                <th className="p-3 w-16 no-print">Print</th>
              </tr>
            </thead>
            <tbody className="font-mono-data text-xs">
              {list.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                >
                  <td className="p-3 font-bold">{w.id}</td>
                  <td className="p-3">{w.title}</td>
                  <td className="p-3">
                    <Link to={`/machines/${w.machineId}`} className="text-muted-foreground hover:text-foreground">
                      {w.machineId}
                    </Link>
                  </td>
                  <td className={`p-3 uppercase ${priorityColor[w.priority]}`}>
                    {w.priority}
                  </td>
                  <td className="p-3 uppercase text-muted-foreground">
                    {w.status.replace("_", " ")}
                  </td>
                  <td className="p-3 text-muted-foreground">{w.assignee}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(w.dueAt).toISOString().slice(5, 16).replace("T", " ")}
                  </td>
                  <td className="p-3 no-print">
                    <button
                      onClick={() => printSingleWorkOrder(w)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Print ${w.id}`}
                      title="Print this work order"
                    >
                      <Printer className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Printable header — only shows when printing the filtered list */}
        <div className="print-only">
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>
            Work Orders — {filter === "all" ? "All" : filter.replace("_", " ").toUpperCase()}
          </h1>
          <p style={{ marginBottom: 12, color: "#444" }}>
            Printed {new Date().toLocaleString()} · {list.length} item(s)
          </p>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Machine</th><th>Priority</th>
                <th>Status</th><th>Assignee</th><th>Due</th>
              </tr>
            </thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id}>
                  <td>{w.id}</td>
                  <td>{w.title}</td>
                  <td>{w.machineId} — {getMachine(w.machineId)?.name ?? ""}</td>
                  <td>{w.priority.toUpperCase()}</td>
                  <td>{w.status.replace("_", " ").toUpperCase()}</td>
                  <td>{w.assignee}</td>
                  <td>{new Date(w.dueAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "crit";
}) {
  const colorClass =
    tone === "crit"
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : tone === "ok"
      ? "text-led-ok"
      : "text-foreground";
  return (
    <Panel className="p-5 h-24 flex flex-col justify-between">
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-mono-data text-3xl font-bold ${colorClass}`}>
        {String(value).padStart(2, "0")}
      </span>
    </Panel>
  );
}

export default WorkOrders;
