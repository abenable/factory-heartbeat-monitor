import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Cpu,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  Image as ImageIcon,
  Link2,
  MapPin,
  Package,
  Plus,
  ShieldAlert,
  Upload,
  Users,
  Wrench,
} from "lucide-react";
import { SupervisorLayout } from "@/components/SupervisorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { isViewer } from "@/lib/auth";
import { getWorker, WORKERS, onLeaveUsernames } from "@/data/workers";
import {
  machines,
  workOrders,
  getMachine,
  pmTasks,
  addWorkOrder,
  WorkOrderStatus,
} from "@/data/cmms";
import { jobRequests, updateJobRequest, JobRequestStatus } from "@/data/jobRequests";
import { purchaseOrders, materialAlerts } from "@/data/materials";
import { costTrend, qualityBreakdown, plantPerformance } from "@/data/performance";
import { recentFiles } from "@/data/files";
import { LucideIcon } from "lucide-react";
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
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const PLANTS = ["All", "Jinja North", "Jinja South"] as const;
const DAYS_OPTIONS = [
  { label: "All time", value: "0" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
] as const;
const SITE_SECTOR: Record<string, string[]> = {
  "Jinja North": ["North Wing"],
  "Jinja South": ["South Wing"],
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  open: "#3b82f6",
  in_progress: "#0ea5e9",
  blocked: "#f59e0b",
  done: "#22c55e",
};

const MACHINE_STATUS_COLORS: Record<string, string> = {
  running: "#22c55e",
  idle: "#f59e0b",
  down: "#ef4444",
  maintenance: "#8b5cf6",
};

const STATUS_LABEL: Record<JobRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  converted: "Converted",
};

const STATUS_BADGE: Record<JobRequestStatus, string> = {
  new: "bg-led-crit text-white",
  assigned: "bg-led-warn text-white",
  in_progress: "bg-primary text-primary-foreground",
  converted: "bg-led-ok text-white",
};

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

function fileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="size-4 text-red-600" />;
    case "xlsx":
      return <FileSpreadsheet className="size-4 text-emerald-600" />;
    case "docx":
      return <FileType className="size-4 text-blue-600" />;
    default:
      return <ImageIcon className="size-4 text-purple-600" />;
  }
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className={`text-2xl font-bold tracking-tight ${color}`}>
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  title: string;
  icon: LucideIcon;
  to: string;
  linkedModules: string;
  linked: string;
  children: React.ReactNode;
  className?: string;
}

function ModuleCard({ title, icon: Icon, to, linkedModules, linked, children, className }: ModuleCardProps) {
  return (
    <Card className={`border-border/60 hover:shadow-md transition-shadow ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Link to={to} className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="size-4" />
            </div>
            <CardTitle className="text-sm group-hover:text-primary transition-colors">{title}</CardTitle>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground hover:text-primary cursor-help">
                <Link2 className="size-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="max-w-[220px] text-xs">
                Synced with {linked}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const viewer = isViewer();
  const [site, setSite] = useState<string>("All");
  const [team, setTeam] = useState<string>("All");
  const [daysRaw, setDaysRaw] = useState<string>("0");
  const [requestFilter, setRequestFilter] = useState<string>("all");
  const [tick, setTick] = useState(0);

  const days = parseInt(daysRaw, 10);
  const cutoff = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  const departments = useMemo(
    () => ["All", ...Array.from(new Set(Object.values(WORKERS).map((w) => w.department)))],
    [],
  );

  const siteOk = (machineId?: string, plant?: string) => {
    if (site === "All") return true;
    if (plant) return plant === site;
    const m = getMachine(machineId ?? "");
    if (!m) return false;
    return SITE_SECTOR[site].some((w) => m.sector.includes(w));
  };

  const dateOk = (iso?: string) => {
    if (!cutoff || !iso) return true;
    return new Date(iso).getTime() >= cutoff.getTime();
  };

  const teamOk = (username?: string) => {
    if (team === "All" || !username) return true;
    const w = getWorker(username);
    return w?.department === team;
  };

  const filteredWorkOrders = workOrders.filter(
    (w) => dateOk(w.createdAt) && siteOk(w.machineId) && teamOk(w.assignee),
  );

  const filteredMachines = machines.filter(
    (m) => site === "All" || SITE_SECTOR[site].some((w) => m.sector.includes(w)),
  );

  const filteredRequests = jobRequests.filter(
    (r) => dateOk(r.requestedAt) && (site === "All" || r.plant === site),
  );

  const filteredPOs = purchaseOrders.filter(
    (p) => dateOk(p.eta) && (site === "All" || p.plant === site),
  );

  const craftsmanUsers = Object.values(WORKERS).filter(
    (w) =>
      (w.role === "technician" || w.role === "supervisor") && teamOk(w.username),
  );

  const activeAssignees = useMemo(
    () =>
      new Set(
        filteredWorkOrders
          .filter((w) => w.status === "open" || w.status === "in_progress")
          .map((w) => w.assignee),
      ),
    [filteredWorkOrders],
  );

  const craftsmenMetrics = useMemo(() => {
    const total = craftsmanUsers.length || 1;
    const assigned = craftsmanUsers.filter((w) => activeAssignees.has(w.username)).length;
    const onLeave = craftsmanUsers.filter((w) => onLeaveUsernames.includes(w.username)).length;
    const available = Math.max(0, total - assigned - onLeave);
    return { available, assigned, onLeave, total };
  }, [craftsmanUsers, activeAssignees]);

  const equipmentMetrics = useMemo(() => {
    return {
      running: filteredMachines.filter((m) => m.status === "running").length,
      idle: filteredMachines.filter((m) => m.status === "idle").length,
      down: filteredMachines.filter((m) => m.status === "down").length,
      maintenance: filteredMachines.filter((m) => m.status === "maintenance").length,
    };
  }, [filteredMachines]);

  const woMetrics = useMemo(() => {
    return {
      open: filteredWorkOrders.filter((w) => w.status === "open").length,
      in_progress: filteredWorkOrders.filter((w) => w.status === "in_progress").length,
      blocked: filteredWorkOrders.filter((w) => w.status === "blocked").length,
      done: filteredWorkOrders.filter((w) => w.status === "done").length,
    };
  }, [filteredWorkOrders]);

  const poMetrics = useMemo(() => {
    return {
      open: filteredPOs.filter((p) => p.status === "open").length,
      closed: filteredPOs.filter((p) => p.status === "closed").length,
      overdue: filteredPOs.filter((p) => p.status === "overdue").length,
    };
  }, [filteredPOs]);

  const overdueAlerts = materialAlerts.filter(
    (a) => a.severity === "urgent" && dateOk(a.timestamp),
  ).length;

  const visibleRequests = useMemo(() => {
    let list = [...filteredRequests];
    if (requestFilter === "unassigned") {
      list = list.filter((r) => r.status === "new");
    }
    if (requestFilter === "newest") {
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }
    if (requestFilter === "equipment") {
      list.sort((a, b) => a.equipmentId.localeCompare(b.equipmentId));
    }
    return list;
  }, [filteredRequests, requestFilter]);

  const convertRequest = (req: (typeof jobRequests)[0]) => {
    const id = `WO-${Math.floor(2000 + Math.random() * 8000)}`;
    addWorkOrder({
      id,
      title: req.description.slice(0, 60),
      machineId: req.equipmentId,
      status: "open",
      priority: req.priority === "urgent" ? "high" : "medium",
      type: "corrective",
      assignee: "Unassigned",
      department: "",
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      problemDescription: req.description,
      tasks: [{ description: "Assess reported issue" }],
      authorizedBy: "Supervisor",
    });
    updateJobRequest(req.id, { status: "converted" });
    setTick((t) => t + 1);
    toast.success("Converted to work order", { description: id });
  };

  return (
    <SupervisorLayout>
      {/* Header / filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717]">
            Maintenance Management System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisor control centre · 5 modules · shared files
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-panel rounded-lg border border-border px-3 py-2">
            <Filter className="size-4 text-primary" />
            <span className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground hidden sm:inline">
              Global Filter
            </span>
          </div>

          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
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

          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <Users className="size-3.5 mr-2 text-primary" />
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={daysRaw} onValueChange={setDaysRaw}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <Clock className="size-3.5 mr-2 text-primary" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OPTIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <ModuleCard
          title="Work Order Control"
          icon={ClipboardList}
          to="/work-orders"
          linked="Equipment Management, Craftsmen Management, Material Control"
          linkedModules="Equipment, Craftsmen, Materials"
        >
          <div className="flex items-center gap-4">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Open", value: woMetrics.open, color: STATUS_COLORS.open },
                      { name: "In Progress", value: woMetrics.in_progress, color: STATUS_COLORS.in_progress },
                      { name: "Delayed", value: woMetrics.blocked, color: STATUS_COLORS.blocked },
                      { name: "Completed", value: woMetrics.done, color: STATUS_COLORS.done },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={28}
                    outerRadius={45}
                    stroke="none"
                    paddingAngle={2}
                  >
                    {[
                      STATUS_COLORS.open,
                      STATUS_COLORS.in_progress,
                      STATUS_COLORS.blocked,
                      STATUS_COLORS.done,
                    ].map((c, i) => (
                      <Cell key={`wo-${i}`} fill={c} />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Stat label="Open" value={woMetrics.open} color="text-blue-500" />
              <Stat label="In Progress" value={woMetrics.in_progress} color="text-sky-500" />
              <Stat label="Delayed" value={woMetrics.blocked} color="text-amber-500" />
              <Stat label="Completed" value={woMetrics.done} color="text-emerald-500" />
            </div>
          </div>
        </ModuleCard>

        <ModuleCard
          title="Craftsmen Management"
          icon={Users}
          to="/craftsmen-management"
          linked="Work Order Control"
          linkedModules="Work Orders"
        >
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Available", value: craftsmenMetrics.available },
                  { name: "Assigned", value: craftsmenMetrics.assigned },
                  { name: "On Leave", value: craftsmenMetrics.onLeave },
                ]}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip />
                <Bar dataKey="value" fill="#C8102E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <Stat label="Total" value={craftsmenMetrics.total} color="text-foreground" />
            <Stat label="Available" value={craftsmenMetrics.available} color="text-emerald-500" />
          </div>
        </ModuleCard>

        <ModuleCard
          title="Equipment Management"
          icon={Cpu}
          to="/machines"
          linked="Work Order Control, Performance Reports"
          linkedModules="Work Orders, Performance"
        >
          <div className="flex items-center gap-4">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Running", value: equipmentMetrics.running },
                      { name: "Idle", value: equipmentMetrics.idle },
                      { name: "Down", value: equipmentMetrics.down },
                      { name: "PM", value: equipmentMetrics.maintenance },
                    ]}
                    dataKey="value"
                    innerRadius={28}
                    outerRadius={45}
                    stroke="none"
                    paddingAngle={2}
                  >
                    <Cell fill={MACHINE_STATUS_COLORS.running} />
                    <Cell fill={MACHINE_STATUS_COLORS.idle} />
                    <Cell fill={MACHINE_STATUS_COLORS.down} />
                    <Cell fill={MACHINE_STATUS_COLORS.maintenance} />
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 text-xs">
              {Object.entries(equipmentMetrics).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: MACHINE_STATUS_COLORS[k] }}
                    />
                    {k.replace("maintenance", "Under PM")}
                  </span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground mb-2">
              Upcoming PM
            </div>
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
              {pmTasks
                .filter(
                  (p) =>
                    site === "All" ||
                    SITE_SECTOR[site].some((w) => getMachine(p.machineId)?.sector.includes(w)),
                )
                .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs rounded-md bg-panel px-2 py-1"
                  >
                    <span className="truncate flex-1">{p.task}</span>
                    <span className="text-muted-foreground shrink-0">{shortDate(p.nextDue)}</span>
                  </div>
                ))}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard
          title="Material Control & Purchase"
          icon={Package}
          to="/material-control"
          linked="Work Order Control"
          linkedModules="Work Orders"
        >
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Open", value: poMetrics.open },
                  { name: "Closed", value: poMetrics.closed },
                  { name: "Overdue", value: poMetrics.overdue },
                ]}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery alerts</span>
              <Badge variant={overdueAlerts > 0 ? "destructive" : "secondary"} className="text-[10px]">
                {overdueAlerts} overdue
              </Badge>
            </div>
            <div className="space-y-1.5">
              {materialAlerts
                .filter((a) => dateOk(a.timestamp))
                .slice(0, 2)
                .map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2 text-xs rounded-md bg-panel px-2 py-1.5"
                  >
                    {a.severity === "urgent" ? (
                      <ShieldAlert className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <Package className="size-3.5 text-primary shrink-0 mt-0.5" />
                    )}
                    <span className={a.severity === "urgent" ? "text-red-600 font-medium" : "text-muted-foreground"}>
                      {a.message}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </ModuleCard>

        <ModuleCard
          title="Performance Reports"
          icon={BarChart3}
          to="/performance-reports"
          linked="Work Order Control, Equipment Management"
          linkedModules="Work Orders, Equipment"
          className="md:col-span-2 xl:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground">
                Cost Trend (USD)
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={costTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8102E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C8102E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ReTooltip />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#C8102E"
                      fill="url(#costGradient)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="planned"
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      dot={false}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground">
                Backlog Gauge
              </div>
              <div className="h-28 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Backlog",
                          value: filteredWorkOrders.filter((w) => w.status !== "done").length,
                        },
                        {
                          name: "Clear",
                          value: Math.max(
                            1,
                            filteredWorkOrders.filter((w) => w.status === "done").length,
                          ),
                        },
                      ]}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={40}
                      outerRadius={55}
                      stroke="none"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#e5e5e5" />
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-2 text-center">
                  <span className="text-lg font-bold text-red-600">
                    {filteredWorkOrders.filter((w) => w.status !== "done").length}
                  </span>
                  <div className="text-[10px] text-muted-foreground">active</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground">
                Quality
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={30}
                      outerRadius={45}
                      stroke="none"
                    >
                      {qualityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend verticalAlign="bottom" height={20} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono-data uppercase tracking-widest text-muted-foreground">
                Plant Performance
              </div>
              <div className="h-28 flex flex-col justify-center">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-[#171717]">
                    {plantPerformance.current}%
                  </span>
                  <span
                    className={`flex items-center text-xs font-medium ${
                      plantPerformance.current >= plantPerformance.previous
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {plantPerformance.current >= plantPerformance.previous ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {Math.abs(plantPerformance.current - plantPerformance.previous).toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target {plantPerformance.target}%
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${plantPerformance.current}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ModuleCard>
      </div>

      {/* Job requests + files */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                <CardTitle className="text-base">Incoming Job Requests</CardTitle>
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  {filteredRequests.length}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={requestFilter} onValueChange={setRequestFilter}>
                  <SelectTrigger className="h-8 text-xs w-[150px]">
                    <Filter className="size-3 mr-1" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All requests</SelectItem>
                    <SelectItem value="unassigned">Unassigned only</SelectItem>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="equipment">By equipment</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => setTick((t) => t + 1)}
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={viewer}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {visibleRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No job requests match the current filters.
                </div>
              )}
              {visibleRequests.map((jr) => (
                <div
                  key={jr.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                    jr.priority === "urgent"
                      ? "border-red-300 bg-red-50/50"
                      : "border-border bg-panel"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`mt-1 size-2 rounded-full shrink-0 ${
                        jr.priority === "urgent" ? "bg-red-600 animate-pulse" : "bg-primary"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
                          {jr.id}
                        </span>
                        <Badge className={`text-[10px] ${STATUS_BADGE[jr.status]}`}>
                          {STATUS_LABEL[jr.status]}
                        </Badge>
                        {jr.priority === "urgent" && (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="size-3 mr-1" /> Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{jr.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{relativeTime(jr.requestedAt)}</span>
                        <span>by {jr.requester}</span>
                        <Link
                          to={`/machines/${jr.equipmentId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {jr.equipmentName} ({jr.equipmentId})
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    {jr.status !== "converted" && (
                      <Button
                        size="sm"
                        className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => convertRequest(jr)}
                        disabled={viewer}
                      >
                        <Plus className="size-3.5 mr-1" /> Convert to WO
                      </Button>
                    )}
                    {jr.status === "converted" && (
                      <Badge className="h-8 bg-led-ok text-white">
                        <CheckCircle2 className="size-3.5 mr-1" /> Converted
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => navigate(`/machines/${jr.equipmentId}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Files widget */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <CardTitle className="text-base">Files Area</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" disabled={viewer}>
                <Upload className="size-3.5 mr-1" /> Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-panel transition-colors cursor-pointer"
                >
                  <div className="size-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    {fileIcon(f.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.size} · {shortDate(f.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SupervisorLayout>
  );
}
