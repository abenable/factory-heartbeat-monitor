import { Link, useParams } from "react-router-dom";
import { Printer, Pencil } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { StatusDot } from "@/components/StatusDot";
import { Button } from "@/components/ui/button";
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
import { getWorker } from "@/data/workers";
import { isViewer } from "@/lib/auth";
import { Wrench, HardHat, Package, ClipboardList, Users, MapPin, Gauge, Battery, History, AlertOctagon } from "lucide-react";

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
        <Panel className="p-6">
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
            <div className="flex items-center gap-3">
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
              {!isViewer() && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/machines/${machine.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Panel>

        {/* Asset Identification */}
        {(machine.manufacturer || machine.modelNumber || machine.serialNumber) && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Package className="size-3.5" />
                Asset Identification
              </span>
            </SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailCell label="Manufacturer" value={machine.manufacturer} />
              <DetailCell label="Model Number" value={machine.modelNumber} />
              <DetailCell label="Serial Number" value={machine.serialNumber} />
              <DetailCell label="Asset ID" value={machine.id} />
            </div>
          </div>
        )}

        {/* Location & Installation */}
        {(machine.plant || machine.section || machine.line || machine.installationDate || machine.commissioningDate) && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5" />
                Location &amp; Installation
              </span>
            </SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailCell label="Plant" value={machine.plant} />
              <DetailCell label="Section" value={machine.section} />
              <DetailCell label="Line" value={machine.line} />
              <DetailCell label="Sector" value={machine.sector} />
              <DetailCell label="Installation" value={machine.installationDate} />
              <DetailCell label="Commissioning" value={machine.commissioningDate} />
            </div>
          </div>
        )}

        {/* Technical Specifications */}
        {(machine.powerRating || machine.capacity || machine.speed || machine.operatingParameters || machine.designLimits) && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Gauge className="size-3.5" />
                Technical Specifications
              </span>
            </SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailCell label="Power Rating" value={machine.powerRating} />
              <DetailCell label="Capacity" value={machine.capacity} />
              <DetailCell label="Speed" value={machine.speed} />
            </div>
            {(machine.operatingParameters || machine.designLimits) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Panel className="p-4">
                  <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                    Operating Parameters
                  </span>
                  <p className="text-sm mt-2 leading-relaxed">
                    {machine.operatingParameters ?? "—"}
                  </p>
                </Panel>
                <Panel className="p-4">
                  <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                    Design Limits
                  </span>
                  <p className="text-sm mt-2 leading-relaxed">
                    {machine.designLimits ?? "—"}
                  </p>
                </Panel>
              </div>
            )}
          </div>
        )}

        {/* Telemetry grid */}
        <div>
          <SectionHeading>
            <span className="flex items-center gap-2">
              <Battery className="size-3.5" />
              Live Telemetry
            </span>
          </SectionHeading>
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

        {/* Maintenance Information */}
        {(machine.maintenanceProcedures || machine.requiredTools || machine.safetyInstructions) && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <ClipboardList className="size-3.5" />
                Maintenance Information
              </span>
            </SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Panel className="p-4">
                <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                  Procedures / Checklists
                </span>
                <p className="text-sm mt-2 leading-relaxed">
                  {machine.maintenanceProcedures ?? "—"}
                </p>
              </Panel>
              <Panel className="p-4">
                <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                  Required Tools
                </span>
                <p className="text-sm mt-2 leading-relaxed">
                  {machine.requiredTools ?? "—"}
                </p>
              </Panel>
              <Panel className="p-4">
                <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
                  Safety Instructions
                </span>
                <p className="text-sm mt-2 leading-relaxed">
                  {machine.safetyInstructions ?? "—"}
                </p>
              </Panel>
            </div>
          </div>
        )}

        {/* Equipment History */}
        <div>
          <SectionHeading>
            <span className="flex items-center gap-2">
              <History className="size-3.5" />
              Equipment History
            </span>
          </SectionHeading>
          <div className="flex flex-col gap-3">
            {/* Timeline items */}
            {machine.installationDate && (
              <HistoryItem
                date={machine.installationDate}
                title="Installation"
                detail={`Installed at ${machine.plant ?? machine.sector}${machine.section ? ` · Section ${machine.section}` : ""}`}
                tone="ok"
              />
            )}
            {machine.commissioningDate && (
              <HistoryItem
                date={machine.commissioningDate}
                title="Commissioning"
                detail="Initial commissioning and acceptance testing completed."
                tone="ok"
              />
            )}
            {machine.lastService && (
              <HistoryItem
                date={machine.lastService}
                title="Last Service"
                detail={`Routine service performed. Next due: ${machine.nextService}`}
                tone="info"
              />
            )}
            {machine.errorCode && (
              <HistoryItem
                date={new Date().toISOString().slice(0, 10)}
                title={`Shutdown — ${machine.errorCode}`}
                detail="Machine auto-shutdown triggered due to critical fault."
                tone="crit"
              />
            )}
            {machineAlerts
              .filter((a) => a.severity === "crit")
              .map((a) => (
                <HistoryItem
                  key={a.id}
                  date={a.timestamp.slice(0, 10)}
                  title={`Critical Alert — ${a.id}`}
                  detail={a.description}
                  tone="crit"
                />
              ))}
            {machinePM.slice(0, 3).map((pm) => (
              <HistoryItem
                key={pm.id}
                date={pm.lastDone}
                title={`PM Completed — ${pm.task}`}
                detail={`Interval: ${pm.intervalDays}d · Next: ${pm.nextDue}`}
                tone="ok"
              />
            ))}
          </div>
        </div>

        {/* Spare Parts & BOM */}
        {machine.spareParts && machine.spareParts.length > 0 && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Package className="size-3.5" />
                Spare Parts &amp; BOM
              </span>
            </SectionHeading>
            <Panel className="overflow-x-auto">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                    <th className="p-3">Part Number</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 w-24 text-right">Quantity</th>
                    <th className="p-3 w-20">Unit</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-xs">
                  {machine.spareParts.map((sp) => (
                    <tr key={sp.partNumber} className="border-b border-border last:border-b-0">
                      <td className="p-3 font-bold">{sp.partNumber}</td>
                      <td className="p-3">{sp.name}</td>
                      <td className="p-3 text-right">{sp.quantity}</td>
                      <td className="p-3 text-muted-foreground">{sp.unit ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        )}

        {/* Assigned Technicians */}
        {machine.assignedTechnicians && machine.assignedTechnicians.length > 0 && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Users className="size-3.5" />
                Assigned Technicians
              </span>
            </SectionHeading>
            <Panel className="p-5">
              <div className="flex flex-wrap gap-2">
                {machine.assignedTechnicians.map((u) => {
                  const worker = getWorker(u);
                  return (
                    <Link
                      key={u}
                      to={`/profile`}
                      className="text-xs px-2.5 py-1 bg-primary text-primary-foreground border border-primary font-medium rounded-full hover:opacity-90 transition-opacity"
                      title={`View ${worker?.name ?? u}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <HardHat className="size-3 text-muted-foreground" />
                        {worker?.name ?? u}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Panel>
          </div>
        )}

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
          <Panel className="overflow-x-auto">
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

function DetailCell({ label, value }: { label: string; value?: string }) {
  return (
    <Panel className="p-4">
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <p className="font-mono-data text-lg mt-2 truncate">{value ?? "—"}</p>
    </Panel>
  );
}

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

function HistoryItem({
  date,
  title,
  detail,
  tone = "info",
}: {
  date: string;
  title: string;
  detail: string;
  tone?: "ok" | "warn" | "crit" | "info";
}) {
  const lineColor =
    tone === "crit" ? "bg-led-crit" : tone === "warn" ? "bg-led-warn" : tone === "ok" ? "bg-led-ok" : "bg-border";
  const textColor =
    tone === "crit" ? "text-led-crit" : tone === "warn" ? "text-led-warn" : tone === "ok" ? "text-led-ok" : "text-muted-foreground";

  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className={`w-2 h-2 rounded-full ${lineColor}`} />
        <div className="w-px h-full bg-border" />
      </div>
      <div className="pb-4">
        <span className={`font-mono-data text-[10px] uppercase tracking-widest ${textColor}`}>
          {date}
        </span>
        <p className="text-sm font-medium mt-0.5">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export default MachineDetail;
