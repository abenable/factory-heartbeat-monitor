import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { pmTasks, getMachine } from "@/data/cmms";

function daysUntil(iso: string) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function tone(days: number): "crit" | "warn" | "ok" {
  if (days <= 0) return "crit";
  if (days <= 7) return "warn";
  return "ok";
}

const PMSchedule = () => {
  const sorted = [...pmTasks].sort(
    (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime(),
  );

  const overdue = sorted.filter((p) => daysUntil(p.nextDue) <= 0).length;
  const dueSoon = sorted.filter((p) => {
    const d = daysUntil(p.nextDue);
    return d > 0 && d <= 7;
  }).length;

  return (
    <AppLayout pageTitle="Preventive Maintenance Schedule" breadcrumb="PM PLANNING">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat label="Overdue" value={overdue} tone="crit" />
          <Stat label="Due This Week" value={dueSoon} tone="warn" />
          <Stat label="Total Tracked" value={sorted.length} />
        </div>

        <SectionHeading>Upcoming Tasks</SectionHeading>
        <Panel className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-muted-foreground uppercase">
                <th className="p-3 w-24">PM ID</th>
                <th className="p-3 w-36">Node</th>
                <th className="p-3">Task</th>
                <th className="p-3 w-24">Interval</th>
                <th className="p-3 w-32">Last Done</th>
                <th className="p-3 w-32">Next Due</th>
                <th className="p-3 w-28 text-right">Days</th>
              </tr>
            </thead>
            <tbody className="font-mono-data text-xs">
              {sorted.map((p) => {
                const days = daysUntil(p.nextDue);
                const t = tone(days);
                const colorClass =
                  t === "crit"
                    ? "text-led-crit"
                    : t === "warn"
                    ? "text-led-warn"
                    : "text-led-ok";
                const m = getMachine(p.machineId);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                  >
                    <td className="p-3 font-bold">{p.id}</td>
                    <td className="p-3">
                      <Link
                        to={`/machines/${p.machineId}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {p.machineId}
                      </Link>
                      {m && (
                        <div className="text-[10px] text-muted-foreground/60 uppercase">
                          {m.type}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{p.task}</td>
                    <td className="p-3 text-muted-foreground">{p.intervalDays}d</td>
                    <td className="p-3 text-muted-foreground">{p.lastDone}</td>
                    <td className="p-3">{p.nextDue}</td>
                    <td className={`p-3 text-right uppercase ${colorClass}`}>
                      {days <= 0 ? `${Math.abs(days)}d OVERDUE` : `IN ${days}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : "text-foreground";
  return (
    <Panel
      topAccent={tone === "crit" ? "crit" : tone === "warn" ? "warn" : "default"}
      className="p-5 h-28 flex flex-col justify-between"
    >
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-mono-data text-4xl font-bold ${colorClass}`}>
        {String(value).padStart(2, "0")}
      </span>
    </Panel>
  );
}

export default PMSchedule;
