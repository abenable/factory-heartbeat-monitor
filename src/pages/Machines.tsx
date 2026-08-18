import { Link } from "react-router-dom";
import { Plus, Printer } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel } from "@/components/Panel";
import { StatusDot } from "@/components/StatusDot";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { machines, statusColor, statusLabel, MachineStatus } from "@/data/cmms";
import { useMemo, useState } from "react";
import { isViewer } from "@/lib/auth";

const filters: { key: MachineStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "idle", label: "Idle" },
  { key: "down", label: "Down" },
  { key: "maintenance", label: "Maintenance" },
];

const Machines = () => {
  const [filter, setFilter] = useState<MachineStatus | "all">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return machines.filter((m) => {
      const matchStatus = filter === "all" || m.status === filter;
      const matchQ =
        !q ||
        m.id.toLowerCase().includes(q.toLowerCase()) ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.sector.toLowerCase().includes(q.toLowerCase());
      return matchStatus && matchQ;
    });
  }, [filter, q]);

  return (
    <AppLayout pageTitle="Machines" breadcrumb={`${list.length} OF ${machines.length} NODES`}>
      <div className="flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between no-print">
          <div className="flex flex-wrap gap-2">
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
          <div className="flex gap-2">
            {!isViewer() && (
              <Button asChild size="sm">
                <Link to="/machines/new">
                  <Plus className="size-4" />
                  New Machine
                </Link>
              </Button>
            )}
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, name or sector…"
              className="md:w-80 font-mono-data text-xs bg-panel border-border"
            />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <Panel className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                <th className="p-3 w-10"></th>
                <th className="p-3">Node ID</th>
                <th className="p-3">Type</th>
                <th className="p-3">Sector</th>
                <th className="p-3 text-right">Status</th>
                <th className="p-3 text-right">Load</th>
                <th className="p-3 text-right">Temp</th>
                <th className="p-3 text-right">Uptime 30d</th>
              </tr>
            </thead>
            <tbody className="font-mono-data text-xs">
              {list.map((m) => {
                const tone = statusColor(m.status);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                  >
                    <td className="p-3">
                      <StatusDot tone={tone} pulse={tone === "crit"} />
                    </td>
                    <td className="p-3">
                      <Link to={`/machines/${m.id}`} className="font-bold hover:text-primary">
                        {m.id}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{m.type}</td>
                    <td className="p-3 text-muted-foreground">{m.sector}</td>
                    <td className="p-3 text-right">
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
                        {statusLabel(m.status)}
                      </span>
                    </td>
                    <td className="p-3 text-right">{m.load.toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <span className={m.temp > 100 ? "text-led-crit" : ""}>
                        {m.temp.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="p-3 text-right">{m.uptime.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground font-mono-data text-xs">
                    NO NODES MATCH FILTER
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

export default Machines;
