import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { StatusDot } from "@/components/StatusDot";
import {
  alerts,
  machines,
  statusColor,
  statusLabel,
  workOrders,
  getBacklog,
} from "@/data/cmms";

const Dashboard = () => {
  const running = machines.filter((m) => m.status === "running").length;
  const fleetUptime =
    machines.reduce((s, m) => s + m.uptime, 0) / machines.length;
  const openWO = workOrders.filter((w) => w.status !== "done").length;
  const backlog = getBacklog().length;
  const critical = alerts.filter((a) => a.severity === "crit" && !a.acknowledged)
    .length;
  const recentAlerts = alerts.slice(0, 5);

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
            label="Critical Anomalies"
            value={String(critical).padStart(2, "0")}
            unit={critical > 0 ? "ACTION REQ" : "ALL CLEAR"}
            tone={critical > 0 ? "crit" : "ok"}
          />
        </div>

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

        {/* Event log */}
        <div>
          <SectionHeading
            right={
              <Link
                to="/alerts"
                className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                Open alerts page →
              </Link>
            }
          >
            Recent Event Log
          </SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated">
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-44">
                    Timestamp
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-24">
                    Severity
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase w-36">
                    Node ID
                  </th>
                  <th className="p-3 font-mono-data text-[10px] text-primary uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {recentAlerts.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors ${
                      a.severity === "crit" ? "bg-led-crit/5" : ""
                    }`}
                  >
                    <td className="p-3 text-muted-foreground">
                      {formatTs(a.timestamp)}
                    </td>
                    <td className="p-3">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="p-3">{a.machineId}</td>
                    <td className="p-3 text-foreground/90">{a.description}</td>
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
      ? "text-white"
      : tone === "warn"
      ? "text-white"
      : "text-white";
  return (
    <Panel className="p-5 h-32 flex flex-col justify-between bg-cyan-kpi">
      <span className="font-mono-data text-[10px] text-white/70 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono-data text-4xl font-bold tracking-tight text-white`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono-data text-sm text-white/70">{unit}</span>
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

import { StatusDot } from "@/components/StatusDot";

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

export default Dashboard;
