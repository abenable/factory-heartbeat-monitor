import { useMemo } from "react";
import { Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import logoRed from "@/assets/kmc-logo-red.svg";
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
  DOWNTIME_COST_PER_HOUR,
  getDowntimeCostAnalysis,
} from "@/data/performance";
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

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

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

  // Downtime cost analysis
  const downtime = getDowntimeCostAnalysis();
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

        {/* Downtime Cost Analysis */}
        <div className="flex flex-col gap-6">
          <SectionHeading>Downtime Cost Analysis</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi
              label="Total Downtime Cost"
              value={`$${Math.round(downtime.totalCost).toLocaleString()}`}
              tone="crit"
            />
            <Kpi
              label="Lost Production Hours"
              value={`${downtime.totalDowntimeHours.toFixed(1)}h`}
            />
            <Kpi
              label="Costliest Machine"
              value={downtime.topMachine.id}
              unit={`$${Math.round(downtime.topMachine.cost).toLocaleString()}`}
              tone="crit"
            />
            <Kpi
              label="Avg Cost / Machine"
              value={`$${Math.round(downtime.avgCost).toLocaleString()}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel className="p-5">
              <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
                Downtime Cost by Machine
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Top 8 machines by estimated lost production value over the last 30 days.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={downtime.byCost.slice(0, 8).map((m) => ({
                    name: m.id,
                    cost: Math.round(m.cost),
                  }))}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    width={72}
                  />
                  <RTooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]}
                    contentStyle={chartTooltipStyle}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--led-crit))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel className="p-5">
              <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
                Downtime Cost by Sector
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Lost production value grouped by production sector, based on a rate of ${DOWNTIME_COST_PER_HOUR}/hour.
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={downtime.bySector.map((s) => ({
                    name: s.name,
                    cost: Math.round(s.cost),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <RTooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]}
                    contentStyle={chartTooltipStyle}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
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

        {/* Visual Performance Graphs */}
        <PerformanceGraphs
          machines={machines}
          workOrders={workOrders}
          completedWO={completedWO}
          delayedWO={delayedWO}
          openWO={openWO}
          inProgressWO={inProgressWO}
          suspendedWO={suspendedWO}
          sev={sev}
          mttrHours={mttrHours}
          mtbfHours={mtbfHours}
        />

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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src={logoRed} alt="KMC" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <h1 style={{ fontSize: 20, margin: 0 }}>Kiira Motors Corporation — Performance Report</h1>
          </div>
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
              <tr><th style={{ textAlign: "left" }}>Total Downtime Cost</th><td>${Math.round(downtime.totalCost).toLocaleString()}</td></tr>
              <tr><th style={{ textAlign: "left" }}>Costliest Machine</th><td>{downtime.topMachine.id} (${Math.round(downtime.topMachine.cost).toLocaleString()})</td></tr>
              <tr><th style={{ textAlign: "left" }}>Downtime Cost Rate</th><td>${DOWNTIME_COST_PER_HOUR}/h</td></tr>
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

function Kpi({ label, value, tone, unit }: { label: string; value: string | number; tone?: "ok" | "warn" | "crit"; unit?: string }) {
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
      <div className="flex items-baseline gap-2">
        <span className={`font-mono-data text-3xl font-bold ${colorClass}`}>{value}</span>
        {unit && <span className="font-mono-data text-sm text-muted-foreground">{unit}</span>}
      </div>
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

function PerformanceGraphs({
  machines,
  workOrders,
  completedWO,
  delayedWO,
  openWO,
  inProgressWO,
  suspendedWO,
  sev,
  mttrHours,
  mtbfHours,
}: any) {
  // Uptime per machine
  const uptimeData = machines.map((m: any) => ({
    name: m.id,
    uptime: Number(m.uptime.toFixed(1)),
    downtime: Number((100 - m.uptime).toFixed(1)),
  }));

  // WO status pie
  const statusData = [
    { name: "Open", value: openWO.length, color: "hsl(var(--primary))" },
    { name: "In Progress", value: inProgressWO.length, color: "hsl(var(--accent))" },
    { name: "Blocked", value: suspendedWO.length, color: "hsl(var(--led-warn))" },
    { name: "Completed", value: completedWO.length, color: "hsl(var(--led-ok))" },
  ].filter((d) => d.value > 0);

  // Trend over weeks (synthetic: bucket WOs by week index)
  const weekly = [
    { week: "W1", completed: 3, created: 5 },
    { week: "W2", completed: 4, created: 4 },
    { week: "W3", completed: 6, created: 7 },
    { week: "W4", completed: 5, created: 6 },
    { week: "W5", completed: completedWO.length, created: workOrders.length },
  ];

  // Reliability bars
  const reliability = [
    { name: "MTTR (h)", value: mttrHours },
    { name: "MTBF (h)", value: mtbfHours / 100 }, // scaled to fit
  ];

  // Alerts severity
  const alertData = [
    { name: "Critical", value: sev.crit, color: "hsl(var(--led-crit))" },
    { name: "Warning", value: sev.warn, color: "hsl(var(--led-warn))" },
    { name: "Info", value: sev.info, color: "hsl(var(--muted-foreground))" },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading>Performance Graphs</SectionHeading>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uptime chart */}
        <Panel className="p-5">
          <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
            Machine Uptime vs Downtime
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Shows the share of time each machine has been running over the last 30 days. Tall green bars mean reliable equipment; red portions show how much each asset has been offline.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={uptimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} unit="%" />
              <RTooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="uptime" stackId="a" fill="hsl(var(--led-ok))" name="Uptime %" />
              <Bar dataKey="downtime" stackId="a" fill="hsl(var(--led-crit))" name="Downtime %" />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* WO status pie */}
        <Panel className="p-5">
          <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
            Work Order Status Distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            A snapshot of where every job in the system currently sits. A healthy plant has a large green "Completed" slice and small "Blocked" or "Open" slices.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 11 }}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {/* Weekly trend */}
        <Panel className="p-5">
          <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
            Work Order Throughput Trend
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Compares jobs created vs jobs completed per week. When the "Completed" line stays close to "Created", the team is keeping up. Big gaps signal a growing backlog.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <RTooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="hsl(var(--led-ok))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Alerts severity */}
        <Panel className="p-5">
          <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
            Alerts by Severity
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Highlights how serious today's open alerts are. A large "Critical" slice means urgent intervention is needed; mostly "Info" alerts means the plant is stable.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={alertData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} label={{ fontSize: 11 }}>
                {alertData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <RTooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {/* Fleet uptime area */}
        <Panel className="p-5 lg:col-span-2">
          <h3 className="font-mono-data text-xs text-primary uppercase tracking-widest mb-1">
            Fleet Uptime Trend (Last 7 Days)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Daily average uptime across all machines. A flat line near 100% is the goal — sharp dips usually align with a breakdown or major maintenance event.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={[
                { day: "Mon", uptime: 96.2 },
                { day: "Tue", uptime: 97.1 },
                { day: "Wed", uptime: 94.8 },
                { day: "Thu", uptime: 98.0 },
                { day: "Fri", uptime: 95.4 },
                { day: "Sat", uptime: 97.6 },
                { day: "Sun", uptime: 96.9 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} domain={[80, 100]} unit="%" />
              <RTooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="uptime" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.3)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
