import { Link } from "react-router-dom";
import { Activity, PauseCircle, AlertOctagon, Wrench, Inbox } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { StatusDot } from "@/components/StatusDot";
import {
  machines,
  statusColor,
  statusLabel,
  workOrders,
  getBacklog,
  MachineStatus,
} from "@/data/cmms";
import { jobRequests } from "@/data/jobRequests";

const Dashboard = () => {
  const running = machines.filter((m) => m.status === "running").length;
  const fleetUptime =
    machines.reduce((s, m) => s + m.uptime, 0) / machines.length;
  const openWO = workOrders.filter((w) => w.status !== "done").length;
  const backlog = getBacklog().length;
  const openJR = jobRequests.filter((r) => r.status !== "converted").length;
  const recentRequests = jobRequests.slice(0, 5);

  return (
    <AppLayout
      pageTitle="Facility Overview"
      breadcrumb="ALL SECTORS"
    >
      <div className="flex flex-col gap-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Kpi label="Fleet Uptime (30d)" value={`${fleetUptime.toFixed(2)}`} unit="%" />
          <Kpi label="Active Machines" value={`${running}`} unit={`/ ${machines.length}`} />
          <Kpi label="Open Work Orders" value={`${openWO}`} unit="OPEN" />
          <Kpi
            label="Backlog"
            value={String(backlog).padStart(2, "0")}
            unit={backlog > 0 ? "OVERDUE/AGING" : "CLEAR"}
            tone={backlog > 0 ? "warn" : "ok"}
          />
          <Kpi
            label="Open Job Requests"
            value={String(openJR).padStart(2, "0")}
            unit={openJR > 0 ? "PENDING" : "ALL CLEAR"}
            tone={openJR > 0 ? "warn" : "ok"}
          />
        </div>

        {/* Fleet status strip */}
        <FleetStatus />

        {/* Machine grid */}
        <div>
          <SectionHeading
            right={
              <Link
                to="/machines"
                className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                View all →
              </Link>
            }
          >
            Active Hardware Nodes
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.slice(0, 6).map((m) => {
              const tone = statusColor(m.status);
              return (
                <Link key={m.id} to={`/machines/${m.id}`}>
                  <Panel
                    className="p-5 flex flex-col gap-6 hover:border-ring transition-colors h-full"

                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono-data text-sm font-bold">
                          {m.id}
                        </span>
                        <span className="font-mono-data text-[10px] text-primary uppercase">
                          {m.type}
                        </span>
                      </div>
                      <StatusDot tone={tone} pulse={tone === "crit"} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <Metric label="Status" value={statusLabel(m.status)} tone={tone} />
                      <Metric label="Load" value={`${m.load.toFixed(1)}%`} />
                      <Metric
                        label="Core Temp"
                        value={`${m.temp.toFixed(1)}°C`}
                        tone={m.temp > 100 ? "crit" : undefined}
                      />
                      <Metric
                        label={m.errorCode ? "Error" : "Uptime"}
                        value={m.errorCode ?? `${m.uptime.toFixed(1)}%`}
                        tone={m.errorCode ? "crit" : undefined}
                      />
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent job requests */}
        <div>
          <SectionHeading
            right={
              <Link
                to="/job-requests"
                className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                View all job requests →
              </Link>
            }
          >
            Recent Job Requests
          </SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated">
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-28">
                    ID
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-28">
                    Status
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase">
                    Description
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-36">
                    Equipment
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-28">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentRequests.map((jr) => (
                  <tr
                    key={jr.id}
                    className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        to={`/job-requests/${jr.id}`}
                        className="font-mono-data text-xs font-bold text-primary hover:underline"
                      >
                        {jr.id}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Inbox className="size-3 text-primary" />
                        <span className="capitalize">{jr.status.replace("_", " ")}</span>
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/job-requests/${jr.id}`}
                        className="block hover:underline text-foreground/90"
                      >
                        {jr.description}
                      </Link>
                    </td>
                    <td className="p-3 font-mono-data text-xs text-muted-foreground">
                      <Link to={`/machines/${jr.equipmentId}`} className="hover:text-primary">
                        {jr.equipmentId}
                      </Link>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{formatTs(jr.requestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
};

function Kpi({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "crit" | "ok" | "warn";
}) {
  const accent = tone === "default" ? "default" : tone;
  const valueClass =
    tone === "crit"
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : "text-foreground";
  return (
    <Panel className="p-5 h-32 flex flex-col justify-between bg-gradient-blue">
      <span className="font-mono-data text-[10px] text-cyan uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono-data text-4xl font-bold tracking-tight ${valueClass}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono-data text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
    </Panel>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "crit" | "info";
}) {
  const colorMap = {
    ok: "text-led-ok",
    warn: "text-led-warn",
    crit: "text-led-crit",
    info: "text-led-info",
  };
  return (
    <div className="flex flex-col">
      <span className="font-mono-data text-[10px] text-cyan uppercase">
        {label}
      </span>
      <span
        className={`font-mono-data text-sm ${tone ? colorMap[tone] : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "crit" | "warn" | "info" }) {
  const map = {
    crit: { label: "Critical", tone: "crit" as const },
    warn: { label: "Warning", tone: "warn" as const },
    info: { label: "INFO", tone: "info" as const },
  };
  const s = map[severity];
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot tone={s.tone} pulse={s.tone === "crit"} />
      <span className={`font-bold ${
        s.tone === "crit" ? "text-led-crit" : s.tone === "warn" ? "text-led-warn" : "text-led-info"
      }`}>
        {s.label}
      </span>
    </span>
  );
}

export function formatTs(iso: string) {
  const d = new Date(iso);
  const date = d.toISOString().slice(5, 10).replace("-", "/");
  const time = d.toISOString().slice(11, 19);
  return `${date} ${time}`;
}

const statusConfig: Record<
  MachineStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bar: string }
> = {
  running: { label: "Running", icon: Activity, color: "text-led-ok", bar: "bg-led-ok" },
  idle: { label: "Idle", icon: PauseCircle, color: "text-led-warn", bar: "bg-led-warn" },
  down: { label: "Down", icon: AlertOctagon, color: "text-led-crit", bar: "bg-led-crit" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "text-led-info", bar: "bg-led-info" },
};

function FleetStatus() {
  const total = machines.length || 1;
  const counts = {
    running: machines.filter((m) => m.status === "running").length,
    idle: machines.filter((m) => m.status === "idle").length,
    down: machines.filter((m) => m.status === "down").length,
    maintenance: machines.filter((m) => m.status === "maintenance").length,
  };

  return (
    <div>
      <SectionHeading>
        Fleet Status
      </SectionHeading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(statusConfig) as MachineStatus[]).map((key) => {
          const cfg = statusConfig[key];
          const count = counts[key];
          const percent = Math.round((count / total) * 100);
          return (
            <Panel key={key} className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`size-8 rounded-lg ${cfg.bar}/10 flex items-center justify-center ${cfg.color}`}>
                    <cfg.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{cfg.label}</span>
                </div>
                <span className={`text-2xl font-bold tracking-tight ${cfg.color}`}>{count}</span>
              </div>
              <div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-mono-data">
                  {percent}% of fleet
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
