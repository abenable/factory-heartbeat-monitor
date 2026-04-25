import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { pmTasks, getMachine } from "@/data/cmms";
import { getWorker } from "@/data/workers";

type FreqFilter = "all" | "daily" | "weekly" | "monthly" | "quarterly";

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

const freqFilters: { key: FreqFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
];

const freqLabel = (f?: string) => (f ? f.charAt(0).toUpperCase() + f.slice(1) : "—");

export default function PMSchedule() {
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const base = [...pmTasks].sort(
      (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime(),
    );
    if (freqFilter === "all") return base;
    return base.filter((p) => p.frequency === freqFilter);
  }, [freqFilter]);

  const overdue = sorted.filter((p) => daysUntil(p.nextDue) <= 0).length;
  const dueSoon = sorted.filter((p) => {
    const d = daysUntil(p.nextDue);
    return d > 0 && d <= 7;
  }).length;

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  return (
    <AppLayout pageTitle="Preventive Maintenance Schedule" breadcrumb="PM PLANNING">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat label="Overdue" value={overdue} tone="crit" />
          <Stat label="Due This Week" value={dueSoon} tone="warn" />
          <Stat label="Total Tracked" value={sorted.length} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading>Upcoming Tasks</SectionHeading>
          <div className="flex flex-wrap gap-1">
            {freqFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFreqFilter(f.key)}
                className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                  freqFilter === f.key
                    ? "border-foreground bg-panel-elevated text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sorted.map((p) => {
            const days = daysUntil(p.nextDue);
            const t = tone(days);
            const colorClass =
              t === "crit" ? "text-led-crit" : t === "warn" ? "text-led-warn" : "text-led-ok";
            const m = getMachine(p.machineId);
            const person = p.personInCharge ? getWorker(p.personInCharge) : null;
            const isOpen = expanded === p.id;

            return (
              <Panel key={p.id} className="overflow-hidden">
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="w-full text-left p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-panel-elevated/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-data text-xs font-bold">{p.id}</span>
                      <span className="font-mono-data text-[10px] text-muted-foreground uppercase">
                        {freqLabel(p.frequency)}
                      </span>
                      <span className={`font-mono-data text-[10px] uppercase ${colorClass}`}>
                        {days <= 0 ? `${Math.abs(days)}d OVERDUE` : `IN ${days}d`}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1">{p.task}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Link
                        to={`/machines/${p.machineId}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {p.machineId}
                      </Link>
                      {m && <span>· {m.type}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono-data text-muted-foreground shrink-0">
                    <span>Last: {p.lastDone}</span>
                    <span>Next: {p.nextDue}</span>
                    <span className="hidden md:inline text-[10px] uppercase">
                      {isOpen ? "Collapse ▲" : "Expand ▼"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border bg-panel-elevated/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Detail label="Procedures / Checklist" value={p.procedures} />
                      <Detail label="Required Tools" value={p.requiredTools} />
                      <Detail label="Safety Instructions" value={p.safetyInstructions} />
                      <Detail
                        label="Person in Charge"
                        value={person ? `${person.name} (${person.workerId})` : p.personInCharge ?? "—"}
                      />
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <p className="text-sm mt-1 leading-relaxed">{value ?? "—"}</p>
    </div>
  );
}

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
