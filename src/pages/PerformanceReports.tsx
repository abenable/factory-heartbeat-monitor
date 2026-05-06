import { useMemo } from "react";
import { Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import {
  workOrders,
  getBacklog,
  machines,
  alerts,
  woStatusLabel,
  woTypeLabel,
} from "@/data/cmms";
import { crafts, getCostFor, SKILL_LABELS, LEVEL_LABELS } from "@/data/crafts";
import { getWorker } from "@/data/workers";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function PerformanceReports() {
  const backlog = getBacklog();
  const completedWO = workOrders.filter((w) => w.status === "done");
  const delayedWO = workOrders.filter((w) => w.status !== "done" && new Date(w.dueAt).getTime() < Date.now());
  const suspendedWO = workOrders.filter((w) => w.status === "blocked");
  const openWO = workOrders.filter((w) => w.status === "open");
  const inProgressWO = workOrders.filter((w) => w.status === "in_progress");

  // Cost estimate: sum of (estimatedHours × craftsman rate) per WO
  const totalEstimatedCost = useMemo(() => {
    return workOrders.reduce((sum, wo) => {
      if (!wo.estimatedHours || wo.estimatedHours <= 0) return sum;
      // Find primary craft of assignee
      const worker = crafts.find((c) => {
        const w = getWorker(c.workerUsername);
        return w?.name === wo.assignee || c.workerUsername === wo.assignee;
      });
      const rate = worker ? worker.costPerHourUSD : 8; // default
      return sum + wo.estimatedHours * rate;
    }, 0);
  }, []);

  // Craftsmen performance: WO count per worker
  const craftsmanPerf = useMemo(() => {
    const map = new Map<string, { total: number; done: number; name: string }>();
    workOrders.forEach((wo) => {
      const key = wo.assignee || "Unassigned";
      const curr = map.get(key) || { total: 0, done: 0, name: key };
      curr.total++;
      if (wo.status === "done") curr.done++;
      map.set(key, curr);
    });
    return Array.from(map.entries()).map(([_, v]) => ({
      ...v,
      rate: v.total > 0 ? ((v.done / v.total) * 100).toFixed(0) : "0",
    }));
  }, []);

  // Plant performance extras
  const avgUptime = machines.reduce((s, m) => s + m.uptime, 0) / machines.length;
  const runningCount = machines.filter((m) => m.status === "running").length;
  const downCount = machines.filter((m) => m.status === "down").length;
  const mttrHours = 1.23; // mock
  const mtbfHours = 412; // mock
  const totalDowntime = machines.reduce((s, m) => s + (100 - m.uptime) * 7.2, 0);
  const byMachine = [...machines]
    .map((m) => ({ id: m.id, name: m.name, downtime: (100 - m.uptime) * 7.2 }))
    .sort((a, b) => b.downtime - a.downtime)
    .slice(0, 5);
  const maxDown = Math.max(...byMachine.map((b) => b.downtime), 1);

  // Alerts by severity
  const sev = {
    crit: alerts.filter((a) => a.severity === "crit").length,
    warn: alerts.filter((a) => a.severity === "warn").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };
  const sevTotal = sev.crit + sev.warn + sev.info || 1;

  return (
    <AppLayout pageTitle="Performance Reports" breadcrumb="ANALYTICS & KPIs">
      <div className="flex flex-col gap-6">
        {/* Print button */}
        <div className="flex justify-end no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print Report
          </Button>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Total WO Cost (Est.)" value={`$${totalEstimatedCost.toLocaleString()}`} />
          <Kpi label="Backlog" value={backlog.length} tone={backlog.length > 0 ? "warn" : "ok"} />
          <Kpi label="Delayed Jobs" value={delayedWO.length} tone={delayedWO.length > 0 ? "crit" : "ok"} />
          <Kpi label="Avg Fleet Uptime" value={`${avgUptime.toFixed(1)}%`} />
        </div>

        {/* Reliability KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="MTTR" value={`${mttrHours.toFixed(2)}h`} />
          <Kpi label="MTBF" value={`${mtbfHours}h`} />
          <Kpi label="Total Downtime" value={`${totalDowntime.toFixed(1)}h`} />
          <Kpi label="Fleet Uptime" value={`${avgUptime.toFixed(2)}%`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionHeading>Downtime by Machine (Top 5)</SectionHeading>
            <Panel className="p-5">
              <div className="flex flex-col gap-4">
                {byMachine.map((b) => (
                  <div key={b.id} className="flex flex-col gap-1">
                    <div className="flex justify-between font-mono-data text-xs">
                      <span>{b.id}</span>
                      <span className="text-muted-foreground">{b.downtime.toFixed(1)}h</span>
                    </div>
                    <div className="h-2 bg-panel-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-foreground/70 rounded-full" style={{ width: `${(b.downtime / maxDown) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div>
            <SectionHeading>Alerts by Severity</SectionHeading>
            <Panel className="p-5">
              <div className="flex flex-col gap-4">
                <SevBar label="Critical" count={sev.crit} total={sevTotal} className="bg-led-crit" />
                <SevBar label="Warning" count={sev.warn} total={sevTotal} className="bg-led-warn" />
                <SevBar label="Info" count={sev.info} total={sevTotal} className="bg-muted-foreground" />
              </div>
            </Panel>
          </div>
        </div>

        {/* Work Order Status Breakdown */}
        <div>
          <SectionHeading>Work Order Status</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CountCard label="Open" count={openWO.length} />
            <CountCard label="In Progress" count={inProgressWO.length} />
            <CountCard label="Blocked" count={suspendedWO.length} tone="warn" />
            <CountCard label="Completed" count={completedWO.length} tone="ok" />
            <CountCard label="Total" count={workOrders.length} />
          </div>
        </div>

        {/* Work Order Throughput */}
        <div>
          <SectionHeading>Work Order Throughput</SectionHeading>
          <Panel className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono-data">
              <RawStat label="Created" value={workOrders.length} />
              <RawStat label="Completed" value={workOrders.filter((w) => w.status === "done").length} />
              <RawStat label="In Progress" value={workOrders.filter((w) => w.status === "in_progress").length} />
              <RawStat label="Blocked" value={workOrders.filter((w) => w.status === "blocked").length} />
            </div>
          </Panel>
        </div>

        {/* Completed Work Orders */}
        <div>
          <SectionHeading>Completed Work Orders ({completedWO.length})</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                  <th className="p-3 w-24">ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3 w-32">Assignee</th>
                  <th className="p-3 w-28">Type</th>
                  <th className="p-3 w-32">Completed</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {completedWO.map((wo) => (
                  <tr key={wo.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                    <td className="p-3 font-bold">{wo.id}</td>
                    <td className="p-3">{wo.title}</td>
                    <td className="p-3 text-muted-foreground">{wo.assignee}</td>
                    <td className="p-3 text-muted-foreground">{woTypeLabel(wo.type)}</td>
                    <td className="p-3 text-muted-foreground">
                      {wo.workLog?.actualCompletionTime
                        ? new Date(wo.workLog.actualCompletionTime).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Delayed Jobs */}
        <div>
          <SectionHeading>Delayed Jobs ({delayedWO.length})</SectionHeading>
          <Panel className="overflow-x-auto">
            {delayedWO.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO DELAYED JOBS
              </div>
            ) : (
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                    <th className="p-3 w-24">ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3 w-32">Assignee</th>
                    <th className="p-3 w-32">Due Date</th>
                    <th className="p-3 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {delayedWO.map((wo) => (
                    <tr key={wo.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                      <td className="p-3 font-bold">{wo.id}</td>
                      <td className="p-3">{wo.title}</td>
                      <td className="p-3 text-muted-foreground">{wo.assignee}</td>
                      <td className="p-3 text-led-crit">
                        {new Date(wo.dueAt).toLocaleString()}
                      </td>
                      <td className="p-3 uppercase text-muted-foreground">
                        {woStatusLabel(wo.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Suspended Work Orders */}
        <div>
          <SectionHeading>Suspended Work Orders ({suspendedWO.length})</SectionHeading>
          <Panel className="overflow-x-auto">
            {suspendedWO.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO SUSPENDED WORK ORDERS
              </div>
            ) : (
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                    <th className="p-3 w-24">ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3 w-32">Assignee</th>
                    <th className="p-3 w-32">Due Date</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {suspendedWO.map((wo) => (
                    <tr key={wo.id} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                      <td className="p-3 font-bold">{wo.id}</td>
                      <td className="p-3">{wo.title}</td>
                      <td className="p-3 text-muted-foreground">{wo.assignee}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(wo.dueAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Craftsmen Performance */}
        <div>
          <SectionHeading>Craftsmen Performance</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                  <th className="p-3">Technician</th>
                  <th className="p-3 w-20 text-right">Total WOs</th>
                  <th className="p-3 w-20 text-right">Completed</th>
                  <th className="p-3 w-20 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {crafts
                  .filter((c, i, arr) => arr.findIndex((x) => x.workerUsername === c.workerUsername) === i)
                  .map((c) => {
                    const worker = getWorker(c.workerUsername);
                    const perf = craftsmanPerf.find((p) => p.name === worker?.name || p.name === c.workerUsername);
                    return (
                      <tr key={c.workerUsername} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                        <td className="p-3">
                          <span className="font-medium">{worker?.name ?? c.workerUsername}</span>
                          <span className="block text-[10px] text-muted-foreground uppercase">
                            {SKILL_LABELS[c.skill]} · {LEVEL_LABELS[c.level]}
                          </span>
                        </td>
                        <td className="p-3 text-right">{perf?.total ?? 0}</td>
                        <td className="p-3 text-right">{perf?.done ?? 0}</td>
                        <td className="p-3 text-right">{perf?.rate ?? 0}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Plant Performance */}
        <div>
          <SectionHeading>Plant Performance</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Total Machines" value={machines.length} />
            <Kpi label="Running" value={runningCount} tone="ok" />
            <Kpi label="Down" value={downCount} tone={downCount > 0 ? "crit" : "ok"} />
            <Kpi label="Avg Uptime 30d" value={`${avgUptime.toFixed(1)}%`} />
          </div>
        </div>

        {/* Quality Report —WO completion by type */}
        <div>
          <SectionHeading>Quality Report — Work Order Type Distribution</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                  <th className="p-3">Type</th>
                  <th className="p-3 w-20 text-right">Total</th>
                  <th className="p-3 w-20 text-right">Done</th>
                  <th className="p-3 w-20 text-right">Open</th>
                  <th className="p-3 w-20 text-right">Completion %</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {["corrective", "preventive", "predictive", "condition-based"].map((type) => {
                  const total = workOrders.filter((w) => w.type === type).length;
                  const done = workOrders.filter((w) => w.type === type && w.status === "done").length;
                  const pct = total > 0 ? ((done / total) * 100).toFixed(0) : "0";
                  return (
                    <tr key={type} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                      <td className="p-3">{woTypeLabel(type as any)}</td>
                      <td className="p-3 text-right">{total}</td>
                      <td className="p-3 text-right">{done}</td>
                      <td className="p-3 text-right">{total - done}</td>
                      <td className="p-3 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Printable summary */}
        <div className="print-only">
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>Alpha Industry Limited — Performance Report</h1>
          <p style={{ marginBottom: 12, color: "#444" }}>
            Printed {new Date().toLocaleString()}
          </p>
          <table>
            <tbody>
              <tr><th style={{ textAlign: "left", width: 200 }}>Total WO Cost (Est.)</th><td>${totalEstimatedCost.toLocaleString()}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Backlog</th><td>{backlog.length}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Delayed Jobs</th><td>{delayedWO.length}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Completed WOs</th><td>{completedWO.length}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Suspended WOs</th><td>{suspendedWO.length}</td></tr>
              <tr><th style={{ textAlign: "left" }}>MTTR</th><td>{mttrHours.toFixed(2)}h</td></tr>
              <tr><th style={{ textAlign: "left" }}>MTBF</th><td>{mtbfHours}h</td></tr>
              <tr><th style={{ textAlign: "left" }}>Total Downtime</th><td>{totalDowntime.toFixed(1)}h</td></tr>
              <tr><th style={{ textAlign: "left" }}>Avg Fleet Uptime</th><td>{avgUptime.toFixed(2)}%</td></tr>
              <tr><th style={{ textAlign: "left" }}>Running Machines</th><td>{runningCount}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Down Machines</th><td>{downCount}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Critical Alerts</th><td>{sev.crit}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Warning Alerts</th><td>{sev.warn}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Info Alerts</th><td>{sev.info}</td></tr>
            </tbody>
          </table>
          <h3 style={{ marginTop: 16, fontSize: 14 }}>Downtime by Machine (Top 5)</h3>
          <table>
            <tbody>
              {byMachine.map((b) => (
                <tr key={b.id}>
                  <th style={{ textAlign: "left", width: 200 }}>{b.id}</th>
                  <td>{b.downtime.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 24, display: "flex", gap: 32 }}>
            <div style={{ flex: 1 }}><div style={{ borderBottom: "1px solid #000", height: 40 }} /><small>Prepared by</small></div>
            <div style={{ flex: 1 }}><div style={{ borderBottom: "1px solid #000", height: 40 }} /><small>Supervisor sign-off</small></div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
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
      <span className="font-mono-data text-[10px] text-primary uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-mono-data text-3xl font-bold ${colorClass}`}>{value}</span>
    </Panel>
  );
}

function CountCard({ label, count, tone }: { label: string; count: number; tone?: "ok" | "warn" | "crit" }) {
  const colorClass =
    tone === "crit"
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : tone === "ok"
      ? "text-led-ok"
      : "text-foreground";
  return (
    <Panel className="p-4 text-center">
      <p className={`font-mono-data text-2xl font-bold ${colorClass}`}>{String(count).padStart(2, "0")}</p>
      <p className="font-mono-data text-[10px] text-primary uppercase tracking-widest mt-1">{label}</p>
    </Panel>
  );
}

function SevBar({ label, count, total, className }: { label: string; count: number; total: number; className: string }) {
  const pct = (count / total) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono-data text-xs">
        <span className="uppercase">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-panel-elevated rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RawStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-bold">{String(value).padStart(2, "0")}</span>
    </div>
  );
}
