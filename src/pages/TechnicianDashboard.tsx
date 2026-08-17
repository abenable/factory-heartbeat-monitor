import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  ClipboardList,
  Hourglass,
  Loader2,
  MessageSquare,
  PauseCircle,
  Timer,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TechnicianLayout } from "@/components/TechnicianLayout";
import { ImageUpload, ImageAttachment } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";
import { getWorker, WorkerProfile } from "@/data/workers";
import {
  workOrders as allWorkOrders,
  getMachine,
  updateWorkOrder,
  pmTasks,
  updatePMTask,
  estimatedPMHours,
  pmDaysUntil,
  isPMOverdue,
  isPMDueSoon,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  PMTask,
} from "@/data/cmms";
import { printSingleWorkOrder } from "@/components/PrintableWorkOrder";
import { printPMChecklist } from "@/components/PrintablePMChecklist";

const filters: { key: WorkOrderStatus | "all" | "active"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

const priorityTone: Record<WorkOrderPriority, string> = {
  critical: "bg-led-crit text-white",
  high: "bg-led-warn text-white",
  medium: "bg-primary text-primary-foreground",
  low: "bg-secondary text-secondary-foreground",
};

const statusMeta: Record<
  WorkOrderStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  open: { label: "Open", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-primary" },
  blocked: { label: "Blocked", icon: PauseCircle, color: "text-led-warn" },
  done: { label: "Done", icon: CheckCircle2, color: "text-led-ok" },
};

function nowIso() {
  return new Date().toISOString();
}

function seenKey(username: string) {
  return `technician:${username}:seenWorkOrders`;
}

function getSeenWorkOrderIds(username: string): Set<string> {
  try {
    const raw = localStorage.getItem(seenKey(username));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markWorkOrderSeen(username: string, id: string) {
  const seen = getSeenWorkOrderIds(username);
  if (seen.has(id)) return;
  seen.add(id);
  try {
    localStorage.setItem(seenKey(username), JSON.stringify([...seen]));
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

function woProgress(wo: WorkOrder) {
  const total = wo.tasks.length || 1;
  const done = wo.tasks.filter((t) => t.completed).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fromDatetimeLocal(local?: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function durationHours(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  return (e - s) / 36e5;
}

function formatDurationHours(start?: string, end?: string): string {
  const hours = durationHours(start, end);
  return hours === null ? "—" : `${hours.toFixed(1)} h`;
}

const TechnicianDashboard = () => {
  const username = getUser() ?? "";
  const worker = getWorker(username);
  const [filter, setFilter] = useState<WorkOrderStatus | "all" | "active">("active");
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [refresh, setRefresh] = useState(0);

  const mine = allWorkOrders.filter(
    (w) => w.assignee.toLowerCase() === username.toLowerCase(),
  );

  const seenIds = useMemo(
    () => getSeenWorkOrderIds(username),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, refresh],
  );

  const filtered =
    filter === "all"
      ? mine
      : filter === "active"
      ? mine.filter((w) => w.status !== "done")
      : mine.filter((w) => w.status === filter);

  const activeCount = mine.filter((w) => w.status !== "done").length;
  const doneCount = mine.filter((w) => w.status === "done").length;
  const overdueCount = mine.filter(
    (w) => w.status !== "done" && new Date(w.dueAt).getTime() < Date.now(),
  ).length;

  const repairedWithTimes = useMemo(
    () =>
      mine.filter(
        (w) =>
          w.status === "done" &&
          Boolean(w.workLog?.actualStartTime) &&
          Boolean(w.workLog?.actualCompletionTime),
      ),
    [mine],
  );

  const avgRepairHours = useMemo(() => {
    if (repairedWithTimes.length === 0) return 0;
    const total = repairedWithTimes.reduce((sum, w) => {
      const h = durationHours(w.workLog!.actualStartTime, w.workLog!.actualCompletionTime);
      return sum + (h ?? 0);
    }, 0);
    return total / repairedWithTimes.length;
  }, [repairedWithTimes]);

  const performanceChartData = useMemo(
    () =>
      repairedWithTimes.map((w) => ({
        name: w.referenceNumber || w.id,
        hours: durationHours(w.workLog!.actualStartTime, w.workLog!.actualCompletionTime) ?? 0,
      })),
    [repairedWithTimes],
  );

  return (
    <TechnicianLayout pageTitle={worker?.name ? `Assigned Work — ${worker.name}` : "My Work Orders"}>
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Active Work Orders"
          value={activeCount}
          icon={Clock}
          tone="default"
        />
        <SummaryCard
          label="Completed"
          value={doneCount}
          icon={CheckCircle2}
          tone="ok"
        />
        <SummaryCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          tone={overdueCount > 0 ? "warn" : "default"}
        />
        <SummaryCard
          label="Avg Repair Time"
          value={avgRepairHours > 0 ? Number(avgRepairHours.toFixed(1)) : 0}
          unit={avgRepairHours > 0 ? "h" : ""}
          icon={Timer}
          tone="default"
        />
      </div>

      {/* Performance chart */}
      {performanceChartData.length > 0 && (
        <Card className="mb-6 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                  Performance
                </span>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  Mean Time To Repair (MTTR)
                </CardTitle>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tracking-tight">
                  {avgRepairHours.toFixed(1)}h
                </span>
                <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground block">
                  Average
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceChartData} margin={{ top: 16, right: 16, left: 0, bottom: 16 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "currentColor" }} />
                  <YAxis tick={{ fontSize: 10, fill: "currentColor" }} label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "currentColor" } }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} h`, "Repair Time"]}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                  />
                  <ReferenceLine y={avgRepairHours} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {performanceChartData.map((_, i) => (
                      <Cell key={i} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Bars show repair time per completed work order. Dashed line is your average.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-data uppercase tracking-widest border transition-colors ${
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center border-dashed">
            <p className="text-muted-foreground">No work orders in this view.</p>
          </Card>
        )}
        {filtered.map((wo) => (
          <WorkOrderCard
            key={wo.id}
            wo={wo}
            isNew={!seenIds.has(wo.id)}
            onClick={() => {
              markWorkOrderSeen(username, wo.id);
              setSelected(wo);
              setRefresh((n) => n + 1);
            }}
          />
        ))}
      </div>

      {/* My Preventive Maintenance */}
      <MyPMSection username={username} worker={worker} />

      {selected && (
        <WorkOrderDetailDialog
          wo={selected}
          currentUser={worker}
          onClose={() => setSelected(null)}
          onUpdated={() => setRefresh((n) => n + 1)}
        />
      )}
    </TechnicianLayout>
  );
};

function MyPMSection({ username, worker }: { username: string; worker: WorkerProfile | null }) {
  const [tick, setTick] = useState(0);
  const myPM = useMemo(
    () => pmTasks.filter((p) => p.personInCharge?.toLowerCase() === username.toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, tick],
  );

  if (myPM.length === 0) return null;

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
          My Preventive Maintenance
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {myPM
          .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
          .map((task) => (
            <PMCard key={task.id} task={task} worker={worker} onUpdated={refresh} />
          ))}
      </div>
    </div>
  );
}

function PMCard({
  task,
  worker,
  onUpdated,
}: {
  task: PMTask;
  worker: WorkerProfile | null;
  onUpdated: () => void;
}) {
  const machine = getMachine(task.machineId);
  const days = pmDaysUntil(task.nextDue);
  const overdue = isPMOverdue(task);
  const dueSoon = isPMDueSoon(task);
  const est = estimatedPMHours(task);
  const signatureName = worker?.name ?? task.personInCharge ?? "";

  const acknowledge = () => {
    updatePMTask(task.id, { visitAcknowledgedAt: new Date().toISOString(), visitAcknowledgedByName: signatureName });
    toast.success("PM receipt confirmed", { description: signatureName });
    onUpdated();
  };

  const start = () => {
    updatePMTask(task.id, { visitStartedAt: new Date().toISOString() });
    toast.success("PM visit started", { description: task.id });
    onUpdated();
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
                {task.referenceNumber ?? task.id}
              </span>
              <Badge
                className={`text-[10px] ${
                  overdue ? "bg-led-crit text-white" : dueSoon ? "bg-led-warn text-white" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {overdue ? `${Math.abs(days)}d OVERDUE` : dueSoon ? `Due in ${days}d` : `Due ${formatDate(task.nextDue)}`}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight">{task.task}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Wrench className="size-3.5" />
            {machine?.name ?? task.machineId}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Timer className="size-3.5" /> Est. {est.hours.toFixed(1)}h
          </span>
        </div>

        {!task.visitAcknowledgedAt ? (
          <Button size="sm" onClick={acknowledge}>
            <CheckCircle2 className="size-4" /> Confirm Received
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Received by <strong className="text-foreground">{task.visitAcknowledgedByName}</strong>
            </p>
            {!task.visitStartedAt ? (
              <Button size="sm" variant="outline" onClick={start}>
                <Loader2 className="size-4" /> Start
              </Button>
            ) : (
              <p className="text-xs text-led-ok font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> In progress
              </p>
            )}
          </div>
        )}

        <Button size="sm" variant="outline" onClick={() => printPMChecklist(task)}>
          Print Checklist
        </Button>
      </CardContent>
    </Card>
  );
}

function WorkOrderCard({
  wo,
  isNew,
  onClick,
}: {
  wo: WorkOrder;
  isNew: boolean;
  onClick: () => void;
}) {
  const machine = getMachine(wo.machineId);
  const meta = statusMeta[wo.status];
  const progress = woProgress(wo);
  const overdue = wo.status !== "done" && new Date(wo.dueAt).getTime() < Date.now();
  const isPreventive = wo.type === "preventive";

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer border-border/60 transition-shadow hover:shadow-md hover:border-primary/40 ${
        isNew ? "ring-1 ring-primary/50" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
                {wo.referenceNumber ?? wo.id}
              </span>
              {wo.referenceNumber && (
                <span className="font-mono-data text-[9px] uppercase tracking-widest text-muted-foreground">
                  {wo.id}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {isNew && (
                <Badge className="text-[10px] bg-foreground text-background">
                  New Work Order
                </Badge>
              )}
              {!wo.acknowledgedAt && (
                <Badge className="text-[10px] bg-led-warn text-white">
                  Awaiting Confirmation
                </Badge>
              )}
              {isPreventive && (
                <Badge className="text-[10px] bg-led-ok/15 text-led-ok border border-led-ok/30">
                  Preventive Maintenance
                </Badge>
              )}
              <Badge className={`text-[10px] ${priorityTone[wo.priority]}`}>
                {wo.priority}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight">{wo.title}</CardTitle>
          </div>
          <meta.icon className={`size-5 shrink-0 ${meta.color}`} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Wrench className="size-3.5" />
              {machine?.name ?? wo.machineId}
            </span>
            <span className={`font-mono-data text-xs ${meta.color} flex items-center gap-1`}>
              {meta.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              Due {formatDate(wo.dueAt)}
            </span>
            {overdue && (
              <span className="text-led-crit font-medium flex items-center gap-1">
                <AlertTriangle className="size-3" /> Overdue
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-mono-data uppercase tracking-widest">
                Task Progress
              </span>
              <span className="font-medium">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center text-xs text-primary font-medium">
            Update work log <ChevronRight className="size-3.5 ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkOrderDetailDialog({
  wo,
  currentUser,
  onClose,
  onUpdated,
}: {
  wo: WorkOrder;
  currentUser: WorkerProfile | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [draft, setDraft] = useState<WorkOrder>(() => ({ ...wo }));
  const signatureName = currentUser?.name ?? draft.assignee;

  const machine = getMachine(draft.machineId);
  const progress = useMemo(() => woProgress(draft), [draft]);

  const setStatus = (status: WorkOrderStatus) => {
    setDraft((d) => {
      const next: WorkOrder = { ...d, status };
      if (status === "in_progress" && !next.workLog?.actualStartTime) {
        next.workLog = { ...next.workLog, actualStartTime: nowIso() };
      }
      if (status === "done" && !next.workLog?.actualCompletionTime) {
        next.workLog = {
          ...next.workLog,
          actualCompletionTime: nowIso(),
          completedByName: next.workLog?.completedByName ?? signatureName,
        };
        next.tasks = next.tasks.map((t) => ({ ...t, completed: true }));
      }
      return next;
    });
  };

  const toggleTask = (idx: number) => {
    setDraft((d) => {
      const nextTasks = d.tasks.map((t, i) => (i === idx ? { ...t, completed: !t.completed } : t));
      return { ...d, tasks: nextTasks };
    });
  };

  const updateWorkLog = (field: keyof NonNullable<WorkOrder["workLog"]>, value: string) => {
    setDraft((d) => ({
      ...d,
      workLog: { ...d.workLog, [field]: value },
    }));
  };

  const save = () => {
    updateWorkOrder(draft.id, draft);
    toast.success("Work order updated", { description: draft.id });
    onUpdated();
    onClose();
  };

  const acknowledge = () => {
    const updates = { acknowledgedAt: nowIso(), acknowledgedByName: signatureName };
    setDraft((d) => ({ ...d, ...updates }));
    updateWorkOrder(draft.id, updates);
    toast.success("Receipt confirmed", { description: signatureName });
    onUpdated();
  };

  const startWork = () => {
    const updates: Partial<WorkOrder> = {
      status: "in_progress",
      workLog: { ...draft.workLog, actualStartTime: draft.workLog?.actualStartTime ?? nowIso() },
    };
    setDraft((d) => ({ ...d, ...updates }));
    updateWorkOrder(draft.id, updates);
    toast.success("Work started", { description: draft.id });
    onUpdated();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              {draft.referenceNumber ?? draft.id}
            </span>
            {draft.referenceNumber && (
              <span className="font-mono-data text-[9px] uppercase tracking-widest text-muted-foreground">
                {draft.id}
              </span>
            )}
            {draft.type === "preventive" && (
              <Badge className="text-[10px] bg-led-ok/15 text-led-ok border border-led-ok/30">
                Preventive Maintenance
              </Badge>
            )}
            <Badge className={`text-[10px] ${priorityTone[draft.priority]}`}>{draft.priority}</Badge>
          </div>
          <DialogTitle className="text-left text-xl leading-tight">{draft.title}</DialogTitle>
          <DialogDescription className="text-left">
            {machine?.name ?? draft.machineId} · {machine?.type ?? ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Receipt confirmation */}
          {!draft.acknowledgedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <span className="text-sm">
                <strong>New assignment.</strong> Confirm you've received this work order.
              </span>
              <Button size="sm" onClick={acknowledge}>
                <CheckCircle2 className="size-4" /> Confirm Received
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-panel p-3 text-sm">
              <span className="text-muted-foreground">
                Received by <strong className="text-foreground">{draft.acknowledgedByName}</strong>
                {" · "}
                {formatDate(draft.acknowledgedAt)}
              </span>
              {!draft.workLog?.actualStartTime && (
                <Button size="sm" variant="outline" onClick={startWork}>
                  <Loader2 className="size-4" /> Start Work
                </Button>
              )}
            </div>
          )}

          {/* Status stepper */}
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-panel p-1">
            {(["open", "in_progress", "blocked", "done"] as WorkOrderStatus[]).map((s, i, arr) => {
              const active = draft.status === s;
              const passed =
                arr.indexOf(draft.status) > i || (draft.status === "done" && s !== "done");
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-mono-data uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : passed
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-panel-elevated"
                  }`}
                >
                  {statusMeta[s].label}
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-mono-data uppercase tracking-widest">
                Task Progress
              </span>
              <span className="font-medium">{progress.percent}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Due Date" value={formatDate(draft.dueAt)} icon={CalendarClock} />
            <Meta label="Department" value={draft.department ?? "—"} icon={ClipboardList} />
            <Meta label="Type" value={draft.type.replace("-", " ")} icon={Hourglass} />
            <Meta label="Authorized By" value={draft.authorizedBy ?? "—"} icon={CheckCircle2} />
          </div>

          {/* Problem */}
          {draft.problemDescription && (
            <div className="rounded-lg bg-panel p-3 text-sm">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                Problem Description
              </span>
              <p className="text-muted-foreground leading-relaxed">{draft.problemDescription}</p>
            </div>
          )}

          {/* Resources */}
          {draft.resources && (
            <div className="space-y-2">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
                Required Resources
              </span>
              <div className="flex flex-wrap gap-2">
                {draft.resources.tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
                {draft.resources.spareParts.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
                {draft.resources.ppe.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-3">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              Task Checklist
            </span>
            <div className="space-y-2">
              {draft.tasks.map((t, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-panel p-3 cursor-pointer hover:bg-panel-elevated transition-colors"
                >
                  <Checkbox
                    checked={!!t.completed}
                    onCheckedChange={() => toggleTask(i)}
                    className="mt-0.5"
                  />
                  <span className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Work log */}
          <div className="space-y-3">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              Work Log
            </span>
            <div className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="actualStart" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Timer className="size-3" /> Actual Start
                  </Label>
                  <Input
                    id="actualStart"
                    type="datetime-local"
                    value={toDatetimeLocal(draft.workLog?.actualStartTime)}
                    onChange={(e) => updateWorkLog("actualStartTime", fromDatetimeLocal(e.target.value) ?? "")}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="actualCompletion" className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3" /> Actual Completion
                  </Label>
                  <Input
                    id="actualCompletion"
                    type="datetime-local"
                    value={toDatetimeLocal(draft.workLog?.actualCompletionTime)}
                    onChange={(e) => updateWorkLog("actualCompletionTime", fromDatetimeLocal(e.target.value) ?? "")}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-panel p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-mono-data text-[10px] uppercase tracking-widest">
                  Total Repair Time
                </span>
                <span className="font-semibold text-foreground">
                  {formatDurationHours(draft.workLog?.actualStartTime, draft.workLog?.actualCompletionTime)}
                </span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="observations" className="text-xs text-muted-foreground">
                  Observations / Findings
                </Label>
                <Textarea
                  id="observations"
                  value={draft.workLog?.observations ?? ""}
                  onChange={(e) => updateWorkLog("observations", e.target.value)}
                  placeholder="Describe what you found or fixed..."
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="partsUsed" className="text-xs text-muted-foreground">
                  Parts Used
                </Label>
                <Textarea
                  id="partsUsed"
                  value={draft.workLog?.partsUsed ?? ""}
                  onChange={(e) => updateWorkLog("partsUsed", e.target.value)}
                  placeholder="List spare parts consumed during the job..."
                  rows={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="challengesFaced" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="size-3" /> Challenges / Blockers Faced
                </Label>
                <Textarea
                  id="challengesFaced"
                  value={draft.workLog?.challengesFaced ?? ""}
                  onChange={(e) => updateWorkLog("challengesFaced", e.target.value)}
                  placeholder="Record any problems, delays, safety issues or access constraints..."
                  rows={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="workLogComments" className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="size-3" /> Comments
                </Label>
                <Textarea
                  id="workLogComments"
                  value={draft.workLog?.comments ?? ""}
                  onChange={(e) => updateWorkLog("comments", e.target.value)}
                  placeholder="Any other comments or handover notes..."
                  rows={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Camera className="size-3" /> Job Photos
                </Label>
                <ImageUpload
                  value={draft.workLog?.images ?? []}
                  onChange={(images: ImageAttachment[]) =>
                    setDraft((d) => ({
                      ...d,
                      workLog: { ...d.workLog, images },
                    }))
                  }
                  label="Upload job photos"
                  description="Add photos of the work done or any challenges faced."
                  maxCount={4}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => printSingleWorkOrder(draft)}>
            Print Work Order
          </Button>
          <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  unit = "",
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "default" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok" ? "text-led-ok" : tone === "warn" ? "text-led-warn" : "text-foreground";
  const barColor =
    tone === "ok" ? "bg-led-ok" : tone === "warn" ? "bg-led-warn" : "bg-primary";

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              {label}
            </span>
            <span className={`text-3xl font-bold tracking-tight ${toneClass}`}>
              {String(value).padStart(2, "0")}{unit}
            </span>
          </div>
          <div className={`size-10 rounded-lg ${barColor}/10 flex items-center justify-center ${toneClass}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-panel p-2.5">
      <Icon className="size-4 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

export default TechnicianDashboard;
