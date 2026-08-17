import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import {
  crafts,
  allSkills,
  allLevels,
  SKILL_LABELS,
  LEVEL_LABELS,
  getCostFor,
} from "@/data/crafts";
import { WORKERS, onLeaveUsernames } from "@/data/workers";
import { TechnicianProgressPanel } from "@/pages/TechnicianProgress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function CraftsmenManagement() {
  const workforce = Object.values(WORKERS).filter((w) => w.role !== "viewer");
  const performers = workforce.filter((w) => w.performance);
  const maintenanceWorkforce = workforce.filter((w) => w.department.includes("Maintenance"));

  const avgCompletion = performers.length
    ? performers.reduce((s, w) => s + (w.performance?.completed ?? 0), 0) / performers.length
    : 0;
  const avgDays = performers.length
    ? performers.reduce((s, w) => s + (w.performance?.avgDays ?? 0), 0) / performers.length
    : 0;
  const onLeave = workforce.filter((w) => onLeaveUsernames.includes(w.username)).length;

  const completedData = performers.map((w) => ({
    name: w.name.split(" ")[0],
    completed: w.performance?.completed ?? 0,
    quality: w.performance?.quality ?? 0,
  }));

  const resolutionData = performers.map((w) => ({
    name: w.name.split(" ")[0],
    days: w.performance?.avgDays ?? 0,
  }));

  const trendData = MONTHS.map((m, i) => ({
    month: m,
    value: Math.round(
      performers.reduce((s, w) => s + (w.performance?.monthly[i] ?? 0), 0) / (performers.length || 1),
    ),
  }));

  return (
    <AppLayout pageTitle="Man Power" breadcrumb="WORKFORCE PERFORMANCE">
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryPanel label="Total" value={String(workforce.length).padStart(2, "0")} />
          <SummaryPanel label="On Leave" value={String(onLeave).padStart(2, "0")} />
          <SummaryPanel label="Avg Completed" value={avgCompletion.toFixed(0)} />
          <SummaryPanel label="Avg Days" value={avgDays.toFixed(1)} />
        </div>

        {/* Workforce under the maintenance department */}
        <div>
          <SectionHeading>Workforce — Maintenance Department</SectionHeading>
          <Panel className="overflow-x-auto">
            {maintenanceWorkforce.length === 0 ? (
              <div className="p-6 text-center font-mono-data text-xs text-muted-foreground">
                NO MAINTENANCE-DEPARTMENT STAFF
              </div>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                    <th className="p-3">Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Job Title</th>
                    <th className="p-3 w-28">Shift</th>
                    <th className="p-3 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {maintenanceWorkforce.map((w) => {
                    const onLeaveNow = onLeaveUsernames.includes(w.username);
                    return (
                      <tr key={w.username} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                        <td className="p-3">
                          <div className="font-medium">{w.name}</div>
                          <div className="text-xs text-muted-foreground font-mono-data">{w.workerId}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">{w.department}</td>
                        <td className="p-3 text-muted-foreground">{w.jobTitle}</td>
                        <td className="p-3 text-xs text-muted-foreground">{w.shift}</td>
                        <td className="p-3">
                          <span
                            className={`font-mono-data text-[10px] uppercase px-2 py-0.5 rounded-full ${
                              onLeaveNow
                                ? "bg-led-warn/15 text-led-warn"
                                : "bg-led-ok/15 text-led-ok"
                            }`}
                          >
                            {onLeaveNow ? "On Leave" : "Available"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        {/* Technician progress */}
        <div>
          <SectionHeading>Technician Progress</SectionHeading>
          <TechnicianProgressPanel />
        </div>

        {/* Performance charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel className="p-4">
            <h3 className="text-sm font-medium mb-3">Completed Work Orders</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completedData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReTooltip />
                  <Bar dataKey="completed" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-4">
            <h3 className="text-sm font-medium mb-3">Average Resolution (days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={resolutionData} margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReTooltip />
                  <Bar dataKey="days" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="p-4">
            <h3 className="text-sm font-medium mb-3">Monthly Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReTooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--foreground))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Performance table */}
        <div>
          <SectionHeading>Performance Scores</SectionHeading>
          <Panel className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                  <th className="p-3">Worker</th>
                  <th className="p-3 w-24">Completed</th>
                  <th className="p-3 w-24">Avg Days</th>
                  <th className="p-3 w-24">Availability</th>
                  <th className="p-3 w-24">Quality</th>
                  <th className="p-3 w-24">Safety</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {performers.map((w) => {
                  const p = w.performance!;
                  return (
                    <tr key={w.username} className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{w.jobTitle}</div>
                      </td>
                      <td className="p-3 font-mono-data">{p.completed}</td>
                      <td className="p-3 font-mono-data">{p.avgDays.toFixed(1)}</td>
                      <td className="p-3 font-mono-data">{p.availability}%</td>
                      <td className="p-3 font-mono-data">{p.quality}%</td>
                      <td className="p-3 font-mono-data">{p.safety}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* Skill matrix */}
        {allSkills.map((skill) => (
          <div key={skill}>
            <SectionHeading>{SKILL_LABELS[skill]}</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allLevels.map((level) => {
                const rate = getCostFor(skill, level);
                const levelCrafts = crafts.filter((c) => c.skill === skill && c.level === level);
                return (
                  <Panel key={level} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono-data text-xs uppercase tracking-widest text-primary">
                        {LEVEL_LABELS[level]}
                      </span>
                      <span className="font-mono-data text-[10px] bg-primary text-primary-foreground border border-primary px-2 py-0.5 rounded-full">
                        ${rate}/hr
                      </span>
                    </div>
                    {levelCrafts.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No workers.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {levelCrafts.map((c) => {
                          const worker = WORKERS[c.workerUsername];
                          return (
                            <li key={c.workerUsername} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{worker?.name ?? c.workerUsername}</span>
                              <span className="font-mono-data text-[10px] text-primary uppercase">
                                {worker?.workerId ?? "—"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

function SummaryPanel({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-5">
      <div className="font-mono-data text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
    </Panel>
  );
}
