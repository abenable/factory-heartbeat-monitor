import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { alerts as initialAlerts, AlertSeverity } from "@/data/cmms";
import { SeverityBadge, formatTs } from "./Index";
import { toast } from "sonner";

const filters: { key: AlertSeverity | "all" | "open"; label: string }[] = [
  { key: "open", label: "Unacknowledged" },
  { key: "all", label: "All" },
  { key: "crit", label: "Critical" },
  { key: "warn", label: "Warning" },
  { key: "info", label: "Info" },
];

const Alerts = () => {
  const [items, setItems] = useState(initialAlerts);
  const [filter, setFilter] = useState<AlertSeverity | "all" | "open">("open");

  const list = useMemo(() => {
    return items.filter((a) => {
      if (filter === "all") return true;
      if (filter === "open") return !a.acknowledged;
      return a.severity === filter;
    });
  }, [items, filter]);

  const ack = (id: string) => {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
    toast.success(`Alert ${id} acknowledged`);
  };

  const ackAll = () => {
    const open = items.filter((a) => !a.acknowledged).length;
    setItems((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    toast.success(`${open} alerts acknowledged`);
  };

  const counts = {
    crit: items.filter((a) => a.severity === "crit" && !a.acknowledged).length,
    warn: items.filter((a) => a.severity === "warn" && !a.acknowledged).length,
    info: items.filter((a) => a.severity === "info" && !a.acknowledged).length,
  };

  return (
    <AppLayout pageTitle="Alerts" breadcrumb="EVENT MONITORING">
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Critical" count={counts.crit} tone="crit" />
          <SummaryCard label="Warning" count={counts.warn} tone="warn" />
          <SummaryCard label="Info" count={counts.info} tone="info" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                  filter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={ackAll}
            disabled={items.every((a) => a.acknowledged)}
            className="font-mono-data text-[10px] uppercase tracking-widest border-border bg-panel hover:bg-panel-elevated"
          >
            Acknowledge All
          </Button>
        </div>

        <SectionHeading>Event Log ({list.length})</SectionHeading>
        <Panel className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                <th className="p-3 w-24">ID</th>
                <th className="p-3 w-44">Timestamp</th>
                <th className="p-3 w-20">Severity</th>
                <th className="p-3 w-36">Node</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-32">State</th>
              </tr>
            </thead>
            <tbody className="font-mono-data text-xs">
              {list.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors ${
                    a.severity === "crit" && !a.acknowledged ? "bg-led-crit/5" : ""
                  }`}
                >
                  <td className="p-3 font-bold">{a.id}</td>
                  <td className="p-3 text-muted-foreground">{formatTs(a.timestamp)}</td>
                  <td className="p-3">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="p-3">
                    <Link to={`/machines/${a.machineId}`} className="hover:text-primary">
                      {a.machineId}
                    </Link>
                  </td>
                  <td className="p-3 text-foreground/90">{a.description}</td>
                  <td className="p-3">
                    {a.acknowledged ? (
                      <span className="text-muted-foreground uppercase">Ack'd</span>
                    ) : (
                      <button
                        onClick={() => ack(a.id)}
                        className="text-led-ok hover:underline uppercase"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    NO EVENTS MATCH FILTER
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppLayout>
  );
};

function SummaryCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "crit" | "warn" | "info";
}) {
  const accent = tone === "info" ? "default" : tone;
  const colorClass =
    tone === "crit" ? "text-white" : tone === "warn" ? "text-white" : "text-white";
  return (
    <Panel className="p-5 h-28 flex flex-col justify-between bg-cyan-kpi">
      <span className="font-mono-data text-[10px] text-white/70 uppercase tracking-widest">
        {label} (Open)
      </span>
      <span className={`font-mono-data text-4xl font-bold text-white`}>
        {String(count).padStart(2, "0")}
      </span>
    </Panel>
  );
}

export default Alerts;
