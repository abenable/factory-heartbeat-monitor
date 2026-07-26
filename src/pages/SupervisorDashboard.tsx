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
import { machines, workOrders, getMachine, pmTasks } from "@/data/cmms";
import { WORKERS, onLeaveUsernames } from "@/data/workers";

const PLANTS = ["All", "Jinja North", "Jinja South"] as const;
const SITE_SECTOR: Record<string, string[]> = {
  "Jinja North": ["North Wing"],
  "Jinja South": ["South Wing"],
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

const requestFilters: { key: "all" | JobRequestStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "converted", label: "Converted" },
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

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [site, setSite] = useState<string>("All");
  const [requestFilter, setRequestFilter] = useState<"all" | JobRequestStatus>("all");

  const filteredRequests = useMemo(
    () =>
      jobRequests.filter((r) => site === "All" || r.plant === site),
    [site],
  );

  const visibleRequests = useMemo(() => {
    if (requestFilter === "all") return filteredRequests;
    return filteredRequests.filter((r) => r.status === requestFilter);
  }, [filteredRequests, requestFilter]);

  const filteredMachines = useMemo(
    () =>
      machines.filter(
        (m) => site === "All" || SITE_SECTOR[site].some((w) => m.sector.includes(w)),
      ),
    [site],
  );

  const filteredWorkOrders = useMemo(
    () =>
      workOrders.filter((w) => {
        if (site === "All") return true;
        const m = getMachine(w.machineId ?? "");
        if (!m) return false;
        return SITE_SECTOR[site].some((wng) => m.sector.includes(wng));
      }),
    [site],
  );

  const openJR = useMemo(
    () => filteredRequests.filter((r) => r.status !== "converted").length,
    [filteredRequests],
  );

  const openWO = useMemo(
    () => filteredWorkOrders.filter((w) => w.status !== "done").length,
    [filteredWorkOrders],
  );

  const equipmentDown = useMemo(
    () => filteredMachines.filter((m) => m.status === "down").length,
    [filteredMachines],
  );

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
          return SITE_SECTOR[site].some((w) => m.sector.includes(w));
        })
        .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
        .slice(0, 5),
    [site],
  );

  return (
    <SupervisorLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Live Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview of requests, equipment and crew
            </p>
          </div>

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
          <StatCard
            label="Open Job Requests"
            value={openJR}
            icon={Inbox}
            to="/job-requests"
            highlight={openJR > 0}
          />
          <StatCard
            label="Open Work Orders"
            value={openWO}
            icon={ClipboardList}
            to="/work-orders"
            highlight={openWO > 0}
          />
          <StatCard
            label="Craftsmen Available"
            value={craftsmen.available}
            icon={Users}
            to="/craftsmen-management"
            highlight={false}
          />
          <StatCard
            label="Equipment Down"
            value={equipmentDown}
            icon={Cpu}
            to="/machines"
            highlight={equipmentDown > 0}
          />
        </div>

        {/* Job requests list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Inbox className="size-5 text-primary" />
                  <CardTitle className="text-base">Incoming Job Requests</CardTitle>
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
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No job requests match the current filter.
                  </div>
                )}
                {visibleRequests.map((jr) => (
                  <Link
                    key={jr.id}
                    to={`/job-requests/${jr.id}`}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                      jr.priority === "urgent"
                        ? "border-border bg-panel hover:bg-panel-elevated"
                        : "border-border bg-panel hover:bg-panel-elevated"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`mt-1.5 size-2 rounded-full shrink-0 ${
                          jr.priority === "urgent" ? "bg-foreground animate-pulse" : "bg-muted-foreground"
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
                        <p className="text-sm font-medium truncate mt-0.5 group-hover:underline">
                          {jr.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {relativeTime(jr.requestedAt)}
                          </span>
                          <span>by {jr.requester}</span>
                          <span className="font-mono-data">{jr.equipmentId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <span className="hidden sm:inline">Open request</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Side widgets */}
          <div className="flex flex-col gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="size-5 text-primary" />
                  <CardTitle className="text-base">Equipment Status</CardTitle>
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
                    <ButtonLink to="/machines" label={`View all ${filteredMachines.length} machines`} />
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
                  {upcomingPM.length === 0 && (
                    <p className="text-sm text-muted-foreground">No upcoming PM.</p>
                  )}
                  {upcomingPM.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                    >
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
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  highlight: boolean;
}) {
  return (
    <Link to={to}>
      <Card className="border-border/60 hover:border-primary transition-colors h-full">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div
              className={`text-3xl font-bold tracking-tight ${
                highlight ? "text-foreground" : "text-foreground"
              }`}
            >
              {String(value).padStart(2, "0")}
            </div>
            <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </div>
          </div>
          <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-foreground/70">
            <Icon className="size-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
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
