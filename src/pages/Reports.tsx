import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { machines, alerts, workOrders } from "@/data/cmms";

const Reports = () => {
  const fleetUptime =
    machines.reduce((s, m) => s + m.uptime, 0) / machines.length;
  const mttrHours = 1.23; // mock
  const mtbfHours = 412; // mock
  const totalDowntime = machines
    .map((m) => (100 - m.uptime) * 7.2) // 30d * 24h = 720h, /100
    .reduce((a, b) => a + b, 0);

  // Downtime by machine — top 5
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
    <AppLayout pageTitle="Reports & Analytics" breadcrumb="LAST 30 DAYS">
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Fleet Uptime" value={`${fleetUptime.toFixed(2)}%`} />
          <Kpi label="MTTR" value={`${mttrHours.toFixed(2)}h`} />
          <Kpi label="MTBF" value={`${mtbfHours}h`} />
          <Kpi label="Total Downtime" value={`${totalDowntime.toFixed(1)}h`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SectionHeading>Downtime by Machine (Top 5)</SectionHeading>
            <Panel className="p-5">
              <div className="flex flex-col gap-4">
                {byMachine.map((b) => (
                  <div key={b.id} className="flex flex-col gap-1">
                    <div className="flex justify-between font-mono-data text-xs">
                      <span>{b.id}</span>
                      <span className="text-muted-foreground">
                        {b.downtime.toFixed(1)}h
                      </span>
                    </div>
                    <div className="h-2 bg-panel-elevated">
                      <div
                        className="h-full bg-foreground/70"
                        style={{ width: `${(b.downtime / maxDown) * 100}%` }}
                      />
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

        <div>
          <SectionHeading>Work Order Throughput</SectionHeading>
          <Panel className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono-data">
              <Stat label="Created" value={workOrders.length} />
              <Stat
                label="Completed"
                value={workOrders.filter((w) => w.status === "done").length}
              />
              <Stat
                label="In Progress"
                value={workOrders.filter((w) => w.status === "in_progress").length}
              />
              <Stat
                label="Blocked"
                value={workOrders.filter((w) => w.status === "blocked").length}
              />
            </div>
          </Panel>
        </div>
      </div>
    </AppLayout>
  );
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-5 h-28 flex flex-col justify-between">
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="font-mono-data text-3xl font-bold">{value}</span>
    </Panel>
  );
}

function SevBar({
  label,
  count,
  total,
  className,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
}) {
  const pct = (count / total) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono-data text-xs">
        <span className="uppercase">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-panel-elevated">
        <div className={`h-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="text-3xl font-bold">{String(value).padStart(2, "0")}</span>
    </div>
  );
}

export default Reports;
