import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { StatusDot } from "@/components/StatusDot";
import {
  alerts,
  getMachine,
  pmTasks,
  statusColor,
  statusLabel,
  workOrders,
  getBacklog,
} from "@/data/cmms";
import { printSingleWorkOrder } from "@/components/PrintableWorkOrder";
import { SeverityBadge, formatTs } from "./Index";

const MachineDetail = () => {
  const { id } = useParams<{ id: string }>();
  const machine = id ? getMachine(id) : undefined;

  if (!machine) {
    return (
      <AppLayout pageTitle="Machine not found">
        <Panel className="p-8 text-center">
          <p className="font-mono-data text-sm text-muted-foreground">
            Node ID "{id}" not found in registry.
          </p>
          <Link
            to="/machines"
            className="font-mono-data text-xs text-foreground underline mt-4 inline-block"
          >
            ← Back to machine list
          </Link>
        </Panel>
      </AppLayout>
    );
  }

  const tone = statusColor(machine.status);
  const machineAlerts = alerts.filter((a) => a.machineId === machine.id);
  const machineWO = workOrders.filter((w) => w.machineId === machine.id);
  const machinePM = pmTasks.filter((p) => p.machineId === machine.id);
  const machineBacklog = getBacklog(machine.id);

  return (
    <AppLayout pageTitle={machine.id} breadcrumb={machine.sector.toUpperCase()}>
      <div className="flex flex-col gap-8">
        {/* Header card */}
        <Panel topAccent={tone === "crit" ? "crit" : "default"} className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <StatusDot tone={tone} pulse={tone === "crit"} className="size-3" />
              <div>
                <h2 className="text-xl font-semibold">{machine.name}</h2>
                <p className="font-mono-data text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {machine.id} · {machine.type}
                </p>
              </div>
            </div>
            <div className="font-mono-data text-sm">
              <span
                className={
                  tone === "crit"
                    ? "text-led-crit"
                    : tone === "warn"
                    ? "text-led-warn"
                    : tone === "ok"
                    ? "text-led-ok"
                    : "text-muted-foreground"
                }
              >
                {statusLabel(machine.status)}
              </span>
            </div>
          </div>
        </Panel>

        {/* Telemetry grid */}
        <div>
          <SectionHeading>Live Telemetry</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TelemetryCell label="Load" value={`${machine.load.toFixed(1)}%`} />
            <TelemetryCell
              label="Core Temp"
              value={`${machine.temp.toFixed(1)}°C`}
              tone={machine.temp > 100 ? "crit" : undefined}
            />
            {machine.pressure !== undefined && (
              <TelemetryCell label="Pressure" value={`${machine.pressure} PSI`} />
            )}
            {machine.vibration !== undefined && (
              <TelemetryCell label="Vibration" value={`${machine.vibration} mm/s`} />
            )}
            {machine.cycleTime !== undefined && (
              <TelemetryCell label="Cycle Time" value={`${machine.cycleTime}s`} />
            )}
            <TelemetryCell label="Runtime" value={`${machine.runtimeHours}h`} />
            <TelemetryCell label="Uptime 30d" value={`${machine.uptime.toFixed(1)}%`} />
            <TelemetryCell
              label="Error"
              value={machine.errorCode ?? "—"}
              tone={machine.errorCode ? "crit" : undefined}
            />
          </div>
        </div>

        {/* Service info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel className="p-5">
            <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
              Last Service
            </span>
            <p className="font-mono-data text-2xl mt-2">{machine.lastService}</p>
          </Panel>
          <Panel className="p-5">
            <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
              Next Scheduled Service
            </span>
            <p className="font-mono-data text-2xl mt-2">{machine.nextService}</p>
          </Panel>
        </div>

        {/* Alerts for this machine */}
        <div>
          <SectionHeading>Alert History</SectionHeading>
          <Panel className="overflow-x-auto">
            {machineAlerts.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO ALERTS LOGGED
              </div>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                    <th className="p-3 w-44">Timestamp</th>
                    <th className="p-3 w-20">Severity</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {machineAlerts.map((a) => (
                    <tr key={a.id} className="border-b border-border last:border-b-0">
                      <td className="p-3 text-muted-foreground">{formatTs(a.timestamp)}</td>
                      <td className="p-3">
                        <SeverityBadge severity={a.severity} />
                      </td>
                      <td className="p-3">{a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Backlog for this machine */}
        <div>
          <SectionHeading>
            Backlog · {machineBacklog.length} {machineBacklog.length === 1 ? "item" : "items"}
          </SectionHeading>
          <Panel className="overflow-x-auto" topAccent={machineBacklog.length > 0 ? "warn" : "default"}>
            {machineBacklog.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO BACKLOG — UP TO DATE
              </div>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                    <th className="p-3 w-24">ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3 w-24">Priority</th>
                    <th className="p-3 w-32">Due</th>
                    <th className="p-3 w-16">Print</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {machineBacklog.map((w) => {
                    const isOverdue = new Date(w.dueAt).getTime() < Date.now();
                    return (
                      <tr key={w.id} className="border-b border-border last:border-b-0">
                        <td className="p-3 font-bold">{w.id}</td>
                        <td className="p-3">{w.title}</td>
                        <td className="p-3 uppercase">{w.priority}</td>
                        <td className={`p-3 ${isOverdue ? "text-led-crit" : "text-muted-foreground"}`}>
                          {new Date(w.dueAt).toISOString().slice(5, 16).replace("T", " ")}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => printSingleWorkOrder(w)}
                            className="text-muted-foreground hover:text-foreground"
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

        {/* Work orders */}
        <div>
          <SectionHeading>Work Orders</SectionHeading>
          <Panel className="overflow-x-auto">
            {machineWO.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO WORK ORDERS
              </div>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                    <th className="p-3 w-24">ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3 w-28">Priority</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3 w-32">Assignee</th>
                    <th className="p-3 w-16">Print</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {machineWO.map((w) => (
                    <tr key={w.id} className="border-b border-border last:border-b-0">
                      <td className="p-3 font-bold">{w.id}</td>
                      <td className="p-3">{w.title}</td>
                      <td className="p-3 uppercase">{w.priority}</td>
                      <td className="p-3 uppercase text-muted-foreground">{w.status.replace("_", " ")}</td>
                      <td className="p-3 text-muted-foreground">{w.assignee}</td>
                      <td className="p-3">
                        <button
                          onClick={() => printSingleWorkOrder(w)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Print ${w.id}`}
                        >
                          <Printer className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* PM tasks */}
        <div>
          <SectionHeading>Preventive Maintenance Tasks</SectionHeading>
          <Panel className="overflow-x-auto">
            {machinePM.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO PM TASKS
              </div>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                    <th className="p-3">Task</th>
                    <th className="p-3 w-24">Interval</th>
                    <th className="p-3 w-32">Last Done</th>
                    <th className="p-3 w-32">Next Due</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {machinePM.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-b-0">
                      <td className="p-3">{p.task}</td>
                      <td className="p-3">{p.intervalDays}d</td>
                      <td className="p-3 text-muted-foreground">{p.lastDone}</td>
                      <td className="p-3">{p.nextDue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
};

function TelemetryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "crit";
}) {
  return (
    <Panel className="p-4">
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <p
        className={`font-mono-data text-2xl mt-2 ${
          tone === "crit" ? "text-led-crit" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </Panel>
  );
}

export default MachineDetail;
