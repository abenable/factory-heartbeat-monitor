import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { getBacklog, machines, WorkOrderPriority } from "@/data/cmms";
import { Button } from "@/components/ui/button";
import { printSingleWorkOrder } from "@/components/PrintableWorkOrder";

const priorityColor: Record<WorkOrderPriority, string> = {
  critical: "text-white",
  high: "text-white",
  medium: "text-white",
  low: "text-white/70",
};

const Backlog = () => {
  const [machineFilter, setMachineFilter] = useState<string>("all");
  const all = getBacklog();
  const list = useMemo(
    () => (machineFilter === "all" ? all : all.filter((w) => w.machineId === machineFilter)),
    [all, machineFilter],
  );

  const overdue = all.filter((w) => new Date(w.dueAt).getTime() < Date.now()).length;
  const aging = all.length - overdue;

  // Backlog count per machine for the chips
  const perMachine = machines
    .map((m) => ({ id: m.id, count: all.filter((w) => w.machineId === m.id).length }))
    .filter((x) => x.count > 0);

  const printAll = () => window.print();

  return (
    <AppLayout pageTitle="Backlog" breadcrumb="OVERDUE & AGING WORK">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Total Backlog" value={all.length} />
          <Stat label="Overdue" value={overdue} tone="crit" />
          <Stat label="Aging > 3d" value={aging} tone="warn" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap gap-1">
            <FilterChip active={machineFilter === "all"} onClick={() => setMachineFilter("all")}>
              All ({all.length})
            </FilterChip>
            {perMachine.map((m) => (
              <FilterChip
                key={m.id}
                active={machineFilter === m.id}
                onClick={() => setMachineFilter(m.id)}
              >
                {m.id} ({m.count})
              </FilterChip>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={printAll}>
            <Printer className="size-4" />
            Print Backlog
          </Button>
        </div>

        <SectionHeading>{list.length} Backlog Items</SectionHeading>
        <Panel className="overflow-x-auto">
          {list.length === 0 ? (
            <div className="p-8 text-center font-mono-data text-xs text-white/70">
              NO BACKLOG — ALL CAUGHT UP
            </div>
          ) : (
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                  <th className="p-3 w-24">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3 w-32">Machine</th>
                  <th className="p-3 w-24">Priority</th>
                  <th className="p-3 w-32">Due</th>
                  <th className="p-3 w-20">Age</th>
                  <th className="p-3 w-20 no-print">Print</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {list.map((w) => {
                  const due = new Date(w.dueAt);
                  const isOverdue = due.getTime() < Date.now();
                  const ageDays = Math.floor(
                    (Date.now() - new Date(w.createdAt).getTime()) / 86_400_000,
                  );
                  return (
                    <tr
                      key={w.id}
                      className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                    >
                      <td className="p-3 font-bold">{w.id}</td>
                      <td className="p-3">{w.title}</td>
                      <td className="p-3">
                        <Link
                          to={`/machines/${w.machineId}`}
                          className="text-white/70 hover:text-primary"
                        >
                          {w.machineId}
                        </Link>
                      </td>
                      <td className={`p-3 uppercase ${priorityColor[w.priority]}`}>
                        {w.priority}
                      </td>
                      <td className={`p-3 ${isOverdue ? "text-white" : "text-white/70"}`}>
                        {due.toISOString().slice(5, 16).replace("T", " ")}
                      </td>
                      <td className="p-3 text-white/70">{ageDays}d</td>
                      <td className="p-3 no-print">
                        <button
                          onClick={() => printSingleWorkOrder(w)}
                          className="text-white/70 hover:text-primary"
                          aria-label={`Print ${w.id}`}
                        >
                          <Printer className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
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
      ? "text-white"
      : tone === "warn"
      ? "text-white"
      : tone === "ok"
      ? "text-white"
      : "text-white";
  return (
    <Panel className="p-5 h-24 flex flex-col justify-between bg-cyan-kpi">
      <span className="font-mono-data text-[10px] text-white/70 uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-mono-data text-3xl font-bold ${colorClass}`}>
        {String(value).padStart(2, "0")}
      </span>
    </Panel>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-white/70 hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default Backlog;
