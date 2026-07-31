import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  ClipboardList,
  Users,
  Cpu,
  MapPin,
  Filter,
  ArrowRight,
  AlertTriangle,
  Clock,
  Activity,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { SupervisorLayout } from "@/components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobRequests, JobRequestStatus } from "@/data/jobRequests";
import { maintenanceRequests, MaintenanceRequestStatus, MaintenanceUrgency } from "@/data/maintenanceRequests";
import { machines, workOrders, getMachine, pmTasks, SECTORS } from "@/data/cmms";
import { WORKERS, onLeaveUsernames } from "@/data/workers";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  LineChart,
  Line,
} from "recharts";

const PLANTS = ["All", "Jinja North", "Jinja South"] as const;
const SITE_SECTOR: Record<string, string[]> = {
  "Jinja North": ["Machine Shop", "Welding Line", "Paint Shop", "Chassis Line 1"],
  "Jinja South": ["Trim Shop", "Chassis Line 2", "QIT"],
};

const STATUS_LABEL: Record<JobRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  converted: "Converted",
};

const STATUS_BADGE: Record<JobRequestStatus, string> = {
  new: "bg-foreground text-background",
  assigned: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  converted: "border border-border text-muted-foreground",
};

const MRF_STATUS_LABEL: Record<MaintenanceRequestStatus, string> = {
  submitted: "New",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted",
};

const MRF_STATUS_BADGE: Record<MaintenanceRequestStatus, string> = {
  submitted: "bg-foreground text-background",
  approved: "bg-led-ok text-white",
  rejected: "bg-destructive text-destructive-foreground",
  converted: "border border-border text-muted-foreground",
};

const requestFilters: { key: "all" | JobRequestStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "converted", label: "Converted" },
];

const statusChart = [
  { key: "running", label: "Running" },
  { key: "idle", label: "Idle" },
  { key: "down", label: "Down" },
  { key: "maintenance", label: "PM" },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}

interface DashboardRequestItem {
  id: string;
  linkTo: string;
  status: JobRequestStatus;
  priority: "normal" | "urgent";
  description: string;
  requestedAt: string;
  requester: string;
  equipmentId: string;
  plant: string;
  isMrf: boolean;
  mrfStatus?: MaintenanceRequestStatus;
  mrfUrgency?: MaintenanceUrgency;
}

function mrfPriority(urgency: MaintenanceUrgency): "normal" | "urgent" {
  return urgency === "critical" || urgency === "high" ? "urgent" : "normal";
}

function mapMrfStatusToJobRequestStatus(status: MaintenanceRequestStatus): JobRequestStatus {
  switch (status) {
    case "submitted":
      return "new";
    case "approved":
    case "converted":
      return "converted";
    case "rejected":
      return "converted";
    default:
      return "new";
  }
}

export default function SupervisorDashboard() {
  const [site, setSite] = useState<string>("All");
  const [requestFilter, setRequestFilter] = useState<"all" | JobRequestStatus>("all");

  const dashboardRequests = useMemo<DashboardRequestItem[]>(() => {
    const jrItems: DashboardRequestItem[] = jobRequests.map((r) => ({
      id: r.id,
      linkTo: `/job-requests/${r.id}`,
      status: r.status,
      priority: r.priority,
      description: r.description,
      requestedAt: r.requestedAt,
      requester: r.requester,
      equipmentId: r.equipmentId,
      plant: r.plant,
      isMrf: false,
    }));

    const mrfItems: DashboardRequestItem[] = maintenanceRequests
      .filter((m) => m.status !== "rejected")
      .map((m) => {
        const machine = getMachine(m.equipmentId);
        return {
          id: m.jobNumber,
          linkTo: `/job-requests/maintenance/${m.id}`,
          status: mapMrfStatusToJobRequestStatus(m.status),
          priority: mrfPriority(m.urgency),
          description: m.problemDescription,
          requestedAt: m.submittedAt,
          requester: m.requesterName,
          equipmentId: m.equipmentId,
          plant: machine?.plant ?? "",
          isMrf: true,
          mrfStatus: m.status,
          mrfUrgency: m.urgency,
        };
      });

    return [...jrItems, ...mrfItems]
      .filter((r) => site === "All" || r.plant === site)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [site]);

  const filteredRequests = dashboardRequests;

  const visibleRequests = useMemo(() => {
    if (requestFilter === "all") return filteredRequests;
    return filteredRequests.filter((r) => r.status === requestFilter);
  }, [filteredRequests, requestFilter]);

  const openRequestCount = useMemo(
    () => dashboardRequests.filter((r) => r.status !== "converted").length,
    [dashboardRequests],
  );

  const filteredMachines = useMemo(
    () =>
      machines.filter(
        (m) => site === "All" || SITE_SECTOR[site].some((s) => m.sector === s),
      ),
    [site],
  );

  const filteredWorkOrders = useMemo(
    () =>
      workOrders.filter((w) => {
        if (site === "All") return true;
        const m = getMachine(w.machineId ?? "");
        if (!m) return false;
        return SITE_SECTOR[site].some((s) => m.sector === s);
      }),
    [site],
  );

  const openWO = useMemo(
    () => filteredWorkOrders.filter((w) => w.status !== "done").length,
    [filteredWorkOrders],
  );

  const equipmentDown = useMemo(
    () => filteredMachines.filter((m) => m.status === "down").length,
    [filteredMachines],
  );

  const availability = useMemo(() => {
    if (filteredMachines.length === 0) return 0;
    const up = filteredMachines.filter((m) => m.status === "running" || m.status === "idle").length;
    return Math.round((up / filteredMachines.length) * 100);
  }, [filteredMachines]);

  const craftsmen = useMemo(() => {
    const total = Object.values(WORKERS).filter(
      (w) => w.role === "technician" || w.role === "supervisor",
    ).length;
    const onLeave = Object.values(WORKERS).filter(
      (w) => (w.role === "technician" || w.role === "supervisor") && onLeaveUsernames.includes(w.username),
    ).length;
    return { total, onLeave, available: Math.max(0, total - onLeave) };
  }, []);

  const upcomingPM = useMemo(
    () =>
      pmTasks
        .filter((p) => {
          if (site === "All") return true;
          const m = getMachine(p.machineId);
          if (!m) return false;
          return SITE_SECTOR[site].some((s) => m.sector === s);
        })
        .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
        .slice(0, 5),
    [site],
  );

  const statusData = useMemo(
    () =>
      statusChart.map((s) => ({
        name: s.label,
        value: filteredMachines.filter((m) => m.status === s.key).length,
      })),
    [filteredMachines],
  );

  const woBySector = useMemo(
    () =>
      SECTORS.map((sector) => ({
        name: sector,
        value: filteredWorkOrders.filter((w) => {
          const m = getMachine(w.machineId);
          return m?.sector === sector && w.status !== "done";
        }).length,
      })).filter((d) => d.value > 0 || site === "All"),
    [filteredWorkOrders, site],
  );

  const uptimeTrend = useMemo(
    () => [
      { name: "Jan", value: 92 },
      { name: "Feb", value: 94 },
      { name: "Mar", value: 91 },
      { name: "Apr", value: 95 },
      { name: "May", value: availability },
    ],
    [availability],
  );

  return (
    <SupervisorLayout>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live Dashboard</h1>
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-[170px] h-9 text-xs self-start sm:self-auto">
              <MapPin className="size-3.5 mr-2 text-primary" />
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              {PLANTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Open Requests" value={openRequestCount} icon={Inbox} to="/job-requests" />
          <StatCard label="Open Work Orders" value={openWO} icon={ClipboardList} to="/work-orders" />
          <PercentCard label="Availability" value={availability} icon={Activity} to="/machines" />
          <PercentCard label="Equipment Down" value={equipmentDown} icon={Cpu} to="/machines" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ChartCard title="Equipment Status" icon={Cpu}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  stroke="none"
                  paddingAngle={2}
                >
                  {statusData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={[`hsl(var(--foreground))`, "hsl(var(--muted-foreground))", "hsl(var(--border))", "hsl(var(--secondary))"][i % 4]} />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {statusData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: [`hsl(var(--foreground))`, "hsl(var(--muted-foreground))", "hsl(var(--border))", "hsl(var(--secondary))"][i % 4] }}
                  />
                  {d.value} {d.name}
                </span>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Open WO by Sector" icon={Wrench}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={woBySector} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip />
                <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Uptime Trend" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={uptimeTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
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
          </ChartCard>
        </div>

        {/* Job requests + side widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Inbox className="size-5 text-primary" />
                  <CardTitle className="text-base">Job Requests</CardTitle>
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    {filteredRequests.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  {requestFilters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setRequestFilter(f.key)}
                      className={`px-2.5 py-1 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                        requestFilter === f.key
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {visibleRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No requests.</div>
                )}
                {visibleRequests.map((jr) => (
                  <Link
                    key={jr.id}
                    to={jr.linkTo}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-panel hover:bg-panel-elevated p-3 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`mt-1.5 size-2 rounded-full shrink-0 ${
                          jr.priority === "urgent" ? "bg-foreground animate-pulse" : "bg-muted-foreground"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">{jr.id}</span>
                          {jr.isMrf ? (
                            <>
                              <Badge className={`text-[10px] ${MRF_STATUS_BADGE[jr.mrfStatus!]}`}>
                                {MRF_STATUS_LABEL[jr.mrfStatus!]}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">MRF</Badge>
                            </>
                          ) : (
                            <Badge className={`text-[10px] ${STATUS_BADGE[jr.status]}`}>{STATUS_LABEL[jr.status]}</Badge>
                          )}
                          {jr.priority === "urgent" && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="size-3 mr-1" /> Urgent
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate mt-0.5 group-hover:underline">{jr.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {relativeTime(jr.requestedAt)}</span>
                          <span>{jr.requester}</span>
                          <span className="font-mono-data">{jr.equipmentId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <span className="hidden sm:inline">Open</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="size-5 text-primary" />
                  <CardTitle className="text-base">Equipment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {filteredMachines.slice(0, 6).map((m) => (
                    <Link
                      key={m.id}
                      to={`/machines/${m.id}`}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-panel-elevated transition-colors text-sm"
                    >
                      <span className="truncate flex-1 font-mono-data text-xs">{m.id}</span>
                      <span className="capitalize text-xs text-muted-foreground">{m.status.replace("maintenance", "PM")}</span>
                    </Link>
                  ))}
                  {filteredMachines.length > 6 && (
                    <ButtonLink to="/machines" label={`View all ${filteredMachines.length}`} />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-primary" />
                  <CardTitle className="text-base">Upcoming PM</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {upcomingPM.length === 0 && <p className="text-sm text-muted-foreground">No upcoming PM.</p>}
                  {upcomingPM.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                      <span className="truncate flex-1 text-xs">{p.task}</span>
                      <span className="text-[10px] font-mono-data text-muted-foreground">{shortDate(p.nextDue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SupervisorLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="border-border/60 hover:border-primary transition-colors h-full">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight">{String(value).padStart(2, "0")}</div>
            <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
          </div>
          <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-foreground/70">
            <Icon className="size-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PercentCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="border-border/60 hover:border-primary transition-colors h-full">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold tracking-tight">{value}%</div>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-foreground rounded-full" style={{ width: `${Math.min(100, value)}%` }} />
              </div>
            </div>
            <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground mt-1">{label}</div>
          </div>
          <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-foreground/70 ml-3">
            <Icon className="size-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function ButtonLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors"
    >
      <span>{label}</span>
      <ArrowRight className="size-3" />
    </Link>
  );
}
