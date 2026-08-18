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
  Search,
  Timer,
  TrendingUp,
  Wrench,
  X as XIcon,
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
  acknowledgePMVisit,
  blockPMVisit,
  resumePMVisit,
  completePMVisit,
  comparePMByReference,
  estimatedPMHours,
  pmDaysUntil,
  isPMOverdue,
  isPMDueSoon,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  PMTask,
  PMChecklistItem,
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
  emergency: "bg-led-crit text-white",
  urgent: "bg-led-warn text-white",
  normal: "bg-primary text-primary-foreground",
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

const pmFilters: { key: WorkOrderStatus | "all" | "active"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

/** Free-text search across reference number, task id/name and machine — lets a
 *  technician with a long list quickly jump to a specific checklist. */
function pmMatchesSearch(p: PMTask, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const machine = getMachine(p.machineId);
  const haystack = [p.id, p.referenceNumber, p.task, p.machineId, machine?.name].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function MyPMSection({ username, worker }: { username: string; worker: WorkerProfile | null }) {
  const [tick, setTick] = useState(0);
  const [pmFilter, setPmFilter] = useState<WorkOrderStatus | "all" | "active">("active");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const myPM = useMemo(
    () => pmTasks.filter((p) => p.personInCharge?.toLowerCase() === username.toLowerCase()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [username, tick],
  );

  const filtered = (
    pmFilter === "all"
      ? myPM
      : pmFilter === "active"
      ? myPM.filter((p) => p.visitStatus !== "done")
      : myPM.filter((p) => p.visitStatus === pmFilter)
  ).filter((p) => pmMatchesSearch(p, search));

  // Always look the selected task up fresh from pmTasks so the open dialog
  // reflects the latest state after any update, instead of a stale prop.
  const selectedTask = selectedId ? pmTasks.find((p) => p.id === selectedId) ?? null : null;

  if (myPM.length === 0) return null;

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
          My Preventive Maintenance
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference #, task, machine..."
            className="h-8 w-56 pl-8 pr-7 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        {pmFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setPmFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono-data uppercase tracking-widest border transition-colors ${
              pmFilter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center border-dashed">
            <p className="text-muted-foreground">No preventive maintenance tasks in this view.</p>
          </Card>
        )}
        {filtered
          .sort(comparePMByReference)
          .map((task) => (
            <PMCard key={task.id} task={task} onClick={() => setSelectedId(task.id)} />
          ))}
      </div>

      {selectedTask && (
        <PMTaskDetailDialog
          task={selectedTask}
          currentUser={worker}
          onClose={() => setSelectedId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}

const pmStatusMeta: Record<WorkOrderStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "text-muted-foreground" },
  in_progress: { label: "In Progress", color: "text-primary" },
  blocked: { label: "Blocked", color: "text-led-warn" },
  done: { label: "Done", color: "text-led-ok" },
};

/** Card CTA text — must never read like a status ("Open checklist" on a
 *  finished task looked like the checklist was still open), so it's phrased
 *  differently per visitStatus instead of reusing one generic label. */
function pmCardCta(task: PMTask): string {
  if (!task.visitAcknowledgedAt) return "Confirm receipt";
  switch (task.visitStatus) {
    case "done":
      return "View completed checklist";
    case "blocked":
      return "Resume checklist";
    default:
      return "Continue checklist";
  }
}

function PMCard({ task, onClick }: { task: PMTask; onClick: () => void }) {
  const machine = getMachine(task.machineId);
  const days = pmDaysUntil(task.nextDue);
  const overdue = isPMOverdue(task);
  const dueSoon = isPMDueSoon(task);
  const est = estimatedPMHours(task);
  const meta = pmStatusMeta[task.visitStatus];

  return (
    <Card onClick={onClick} className="cursor-pointer border-border/60 transition-shadow hover:shadow-md hover:border-primary/40">
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
              <span className={`font-mono-data text-[10px] uppercase ${meta.color}`}>{meta.label}</span>
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
        <div className="flex items-center text-xs text-primary font-medium">
          {pmCardCta(task)} <ChevronRight className="size-3.5 ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function PMTaskDetailDialog({
  task,
  currentUser,
  onClose,
  onUpdated,
}: {
  task: PMTask;
  currentUser: WorkerProfile | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const machine = getMachine(task.machineId);
  const signatureName = currentUser?.name ?? task.personInCharge ?? "";
  const [remarks, setRemarks] = useState("");
  const [blockedReason, setBlockedReason] = useState(task.visitBlockedReason ?? "");
  const isDone = task.visitStatus === "done";
  // Once a visit completes, task.checklist resets to blank for the next
  // cycle — the actual filled-in results live in task.history[0].items, so
  // a completed task must read from there instead (matches the print logic).
  const displayItems = isDone && task.history[0] ? task.history[0].items : task.checklist;
  const sections = Array.from(new Set(displayItems.map((i) => i.section)));

  const acknowledge = () => {
    acknowledgePMVisit(task.id, signatureName);
    toast.success("PM receipt confirmed", { description: signatureName });
    onUpdated();
  };

  const setResult = (itemId: string, result: PMChecklistItem["result"]) => {
    const next = task.checklist.map((i) => (i.id === itemId ? { ...i, result } : i));
    updatePMTask(task.id, { checklist: next });
    onUpdated();
  };

  const reportBlocked = () => {
    blockPMVisit(task.id, blockedReason.trim() || undefined);
    toast.info("Marked blocked", { description: task.id });
    onUpdated();
  };

  const resume = () => {
    resumePMVisit(task.id);
    toast.success("Resumed", { description: task.id });
    onUpdated();
  };

  const completeAndSubmit = () => {
    const now = new Date().toISOString();
    const start = task.visitStartedAt ?? task.visitAcknowledgedAt;
    const durationHours = start
      ? Math.max(0, (new Date(now).getTime() - new Date(start).getTime()) / 36e5)
      : undefined;
    completePMVisit(task.id, {
      completedAt: now,
      completedBy: task.personInCharge ?? "",
      startTime: start,
      endTime: now,
      durationHours,
      items: task.checklist,
      remarks: remarks.trim() || undefined,
    });
    toast.success("PM visit completed — sent to supervisor", { description: task.id });
    setRemarks("");
    onUpdated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              {task.referenceNumber ?? task.id}
            </span>
            <Badge className="text-[10px] bg-led-ok/15 text-led-ok border border-led-ok/30">
              {freqLabelPM(task.frequency)}
            </Badge>
          </div>
          <DialogTitle className="text-left text-xl leading-tight">{task.task}</DialogTitle>
          <DialogDescription className="text-left">
            {machine?.name ?? task.machineId} · Due {formatDate(task.nextDue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Receipt confirmation */}
          {!task.visitAcknowledgedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
              <span className="text-sm">
                <strong>New PM assignment.</strong> Confirm you've received this task.
              </span>
              <Button size="sm" onClick={acknowledge}>
                <CheckCircle2 className="size-4" /> Confirm Received
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-panel p-3 text-sm">
                <span className="text-muted-foreground">
                  Received by <strong className="text-foreground">{task.visitAcknowledgedByName}</strong>
                </span>
              </div>

              {/* Status stepper */}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-panel p-1">
                {(["open", "in_progress", "blocked"] as WorkOrderStatus[]).map((s) => {
                  const active = task.visitStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (s === "blocked") reportBlocked();
                        else resume();
                      }}
                      disabled={isDone}
                      className={`flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-mono-data uppercase tracking-wider transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-panel-elevated"
                      } ${isDone ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {pmStatusMeta[s].label}
                    </button>
                  );
                })}
              </div>

              {task.visitStatus === "blocked" && (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Reason blocked</Label>
                  <Input
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    onBlur={() => blockPMVisit(task.id, blockedReason.trim() || undefined)}
                    placeholder="e.g. Waiting on replacement part"
                  />
                </div>
              )}
            </>
          )}

          {isDone && (
            <div className="rounded-lg bg-led-ok/10 border border-led-ok/30 p-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-led-ok" />
              <span>
                Completed and sent to supervisor
                {task.history[0] && ` on ${formatDate(task.history[0].completedAt)}`}.
                {task.history[0]?.approvedByName
                  ? ` Approved by ${task.history[0].approvedByName}.`
                  : " Awaiting supervisor approval."}
              </span>
            </div>
          )}

          {/* Procedures / tools / safety */}
          {(task.procedures || task.requiredTools || task.safetyInstructions) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {task.procedures && <Meta label="Procedures" value={task.procedures} icon={ClipboardList} />}
              {task.requiredTools && <Meta label="Required Tools" value={task.requiredTools} icon={ClipboardList} />}
              {task.safetyInstructions && <Meta label="Safety" value={task.safetyInstructions} icon={AlertTriangle} />}
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-3">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              Checklist
            </span>
            {sections.map((section) => (
              <div key={section} className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{section}</span>
                <div className="space-y-1.5">
                  {displayItems
                    .filter((i) => i.section === section)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-panel p-2.5"
                      >
                        <span className="text-sm flex-1">{item.description}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <PMResultButton
                            active={item.result === "ok"}
                            tone="ok"
                            label="OK"
                            disabled={!task.visitAcknowledgedAt || isDone}
                            onClick={() => setResult(item.id, "ok")}
                          />
                          <PMResultButton
                            active={item.result === "faulty"}
                            tone="crit"
                            label="F"
                            disabled={!task.visitAcknowledgedAt || isDone}
                            onClick={() => setResult(item.id, "faulty")}
                          />
                          <PMResultButton
                            active={item.result === "na"}
                            tone="muted"
                            label="N/A"
                            disabled={!task.visitAcknowledgedAt || isDone}
                            onClick={() => setResult(item.id, "na")}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {!isDone && task.visitAcknowledgedAt && (
            <div className="grid gap-1.5">
              <Label htmlFor="pm-remarks" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3" /> Remarks
              </Label>
              <Textarea
                id="pm-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Notes, parts replaced, follow-up required..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={() => printPMChecklist(task)}>
            Print Checklist
          </Button>
          {task.visitAcknowledgedAt && !isDone && (
            <Button onClick={completeAndSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle2 className="size-4" /> Complete &amp; Submit to Supervisor
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PMResultButton({
  active,
  tone,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  tone: "ok" | "crit" | "muted";
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const activeClass =
    tone === "ok"
      ? "bg-led-ok text-white border-led-ok"
      : tone === "crit"
      ? "bg-led-crit text-white border-led-crit"
      : "bg-secondary text-secondary-foreground border-secondary";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-7 px-2 rounded-md border text-[10px] font-mono-data uppercase flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? activeClass : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function freqLabelPM(f?: string): string {
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : "—";
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
