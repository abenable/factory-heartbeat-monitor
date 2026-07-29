import { useMemo } from "react";
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TechnicianLayout } from "@/components/TechnicianLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser } from "@/lib/auth";
import { getWorker, WORKERS } from "@/data/workers";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function TechnicianPerformance() {
  const username = getUser() ?? "";
  const worker = getWorker(username);
  const performance = worker?.performance;

  const peers = useMemo(
    () =>
      Object.values(WORKERS).filter(
        (w) =>
          w.username !== username &&
          w.performance &&
          w.role !== "viewer" &&
          w.role !== "supervisor",
      ),
    [username],
  );

  const averages = useMemo(() => {
    const list = peers.length ? peers : Object.values(WORKERS).filter((w) => w.performance);
    const count = list.length || 1;
    return {
      completed: list.reduce((s, w) => s + (w.performance?.completed ?? 0), 0) / count,
      avgDays: list.reduce((s, w) => s + (w.performance?.avgDays ?? 0), 0) / count,
      availability: list.reduce((s, w) => s + (w.performance?.availability ?? 0), 0) / count,
      quality: list.reduce((s, w) => s + (w.performance?.quality ?? 0), 0) / count,
      safety: list.reduce((s, w) => s + (w.performance?.safety ?? 0), 0) / count,
    };
  }, [peers]);

  const monthlyData = useMemo(
    () =>
      MONTHS.map((month, i) => ({
        month,
        completed: performance?.monthly[i] ?? 0,
        average: Math.round(
          (peers.length ? peers : Object.values(WORKERS).filter((w) => w.performance)).reduce(
            (s, w) => s + (w.performance?.monthly[i] ?? 0),
            0,
          ) / Math.max(peers.length || 1, 1),
        ),
      })),
    [performance, peers],
  );

  const scorecard = useMemo(
    () => [
      {
        label: "Completed WOs",
        value: performance?.completed ?? 0,
        unit: "",
        icon: CheckCircle2,
        tone: "ok" as const,
        average: averages.completed,
      },
      {
        label: "Avg Resolution",
        value: performance?.avgDays ?? 0,
        unit: " days",
        icon: Clock,
        tone: "default" as const,
        average: averages.avgDays,
        lowerIsBetter: true,
      },
      {
        label: "Availability",
        value: performance?.availability ?? 0,
        unit: "%",
        icon: Zap,
        tone: "default" as const,
        average: averages.availability,
      },
      {
        label: "Quality Score",
        value: performance?.quality ?? 0,
        unit: "%",
        icon: Award,
        tone: worker?.role === "technician" && (performance?.quality ?? 0) >= 95 ? "ok" : "default" as const,
        average: averages.quality,
      },
      {
        label: "Safety Score",
        value: performance?.safety ?? 0,
        unit: "%",
        icon: Shield,
        tone: (performance?.safety ?? 0) === 100 ? "ok" : "default" as const,
        average: averages.safety,
      },
    ],
    [performance, averages, worker?.role],
  );

  return (
    <TechnicianLayout pageTitle={worker?.name ? `My Performance — ${worker.name}` : "My Performance"}>
      <div className="flex flex-col gap-6">
        {/* Intro */}
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                  Progress Overview
                </span>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="size-5 text-primary" />
                  Track your maintenance performance
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  This dashboard uses your completed work orders, resolution times, availability,
                  quality, and safety scores to show how your performance is trending over time.
                </p>
              </div>
              {worker?.jobTitle && (
                <div className="text-right">
                  <span className="block text-sm font-medium">{worker.name}</span>
                  <span className="block text-xs text-muted-foreground">{worker.jobTitle}</span>
                  <span className="block text-xs text-muted-foreground">{worker.department}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!performance ? (
          <Card className="border-border/60 p-8 text-center">
            <p className="text-muted-foreground">
              No performance data is currently available for your profile.
            </p>
          </Card>
        ) : (
          <>
            {/* Scorecards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {scorecard.map((card) => (
                <MetricCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  unit={card.unit}
                  icon={card.icon}
                  tone={card.tone}
                  average={card.average}
                  lowerIsBetter={card.lowerIsBetter}
                />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-border/60 lg:col-span-2">
                <CardHeader className="pb-2">
                  <div>
                    <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                      Monthly Trend
                    </span>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary" />
                      Completed Work Orders Over Time
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="completed"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "hsl(var(--primary))" }}
                          name="Your WOs"
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: "hsl(var(--muted-foreground))" }}
                          name="Peer Average"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Solid line shows your completed work orders per month; dashed line is the average across peer technicians.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <div>
                    <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                      Scorecard
                    </span>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="size-4 text-primary" />
                      You vs Peer Average
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: "Completed", you: performance.completed, avg: averages.completed },
                          { name: "Quality", you: performance.quality, avg: averages.quality },
                          { name: "Safety", you: performance.safety, avg: averages.safety },
                          { name: "Availability", you: performance.availability, avg: averages.availability },
                        ]}
                        margin={{ top: 16, right: 16, left: 0, bottom: 16 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="you" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="You" />
                        <Bar dataKey="avg" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} name="Peer Avg" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compare your key metrics to the average of your peer technicians.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Legend / explanation */}
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h4 className="text-sm font-semibold mb-2">How these numbers are calculated</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Completed WOs</span> — total work orders you closed this review period.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Avg Resolution</span> — average days from work order start to completion.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Availability</span> — percentage of scheduled shifts you were present and fit for duty.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Quality / Safety</span> — supervisor-assessed scores based on rework, inspections, and incidents.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </TechnicianLayout>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  average,
  lowerIsBetter,
}: {
  label: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "ok" | "warn";
  average: number;
  lowerIsBetter?: boolean;
}) {
  const toneClass = tone === "ok" ? "text-led-ok" : tone === "warn" ? "text-led-warn" : "text-foreground";
  const barColor = tone === "ok" ? "bg-led-ok" : tone === "warn" ? "bg-led-warn" : "bg-primary";

  const diff = value - average;
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const diffText = `${better ? "↑" : "↓"} ${Math.abs(diff).toFixed(value < 10 ? 1 : 0)}${unit.replace(" days", "d")}`;

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              {label}
            </span>
            <span className={`text-2xl font-bold tracking-tight ${toneClass}`}>
              {value.toFixed(value < 10 ? 1 : 0)}{unit}
            </span>
            <span
              className={`block text-[10px] font-mono-data mt-1 ${better ? "text-led-ok" : "text-muted-foreground"}`}
            >
              {diffText} vs peer avg
            </span>
          </div>
          <div className={`size-9 rounded-lg ${barColor}/10 flex items-center justify-center shrink-0 ${toneClass}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
