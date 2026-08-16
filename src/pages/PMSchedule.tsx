import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  MinusCircle,
  Plus,
  Timer,
  UserCog,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  pmTasks,
  machines,
  getMachine,
  addPMTask,
  updatePMTask,
  completePMVisit,
  estimatedPMHours,
  pmDaysUntil,
  isPMOverdue,
  isPMDueSoon,
  nextPMTaskId,
  nextPMReferenceNumber,
  buildPMChecklist,
  PMTask,
  PMFrequency,
  PMChecklistItem,
} from "@/data/cmms";
import { WORKERS, getWorker } from "@/data/workers";
import { getUser } from "@/lib/auth";
import { toast } from "sonner";

type FreqFilter = "all" | PMFrequency;
type DueFilter = "all" | "overdue" | "due-soon";

const FREQ_DAYS: Record<PMFrequency, number> = { daily: 1, weekly: 7, monthly: 30, quarterly: 90 };

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

const technicians = Object.values(WORKERS).filter(
  (w) => w.role !== "supervisor" && w.role !== "viewer" && w.role !== "reporter",
);

export default function PMSchedule() {
  const [freqFilter, setFreqFilter] = useState<FreqFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [scheduleTarget, setScheduleTarget] = useState<PMTask | null>(null);
  const [completeTarget, setCompleteTarget] = useState<PMTask | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const sorted = useMemo(() => {
    let base = [...pmTasks].sort(
      (a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime(),
    );
    if (freqFilter !== "all") base = base.filter((p) => p.frequency === freqFilter);
    if (dueFilter === "overdue") base = base.filter((p) => isPMOverdue(p));
    if (dueFilter === "due-soon") base = base.filter((p) => isPMDueSoon(p));
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freqFilter, dueFilter, tick]);

  const overdue = pmTasks.filter((p) => isPMOverdue(p)).length;
  const dueSoon = pmTasks.filter((p) => isPMDueSoon(p)).length;

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const refresh = () => setTick((t) => t + 1);

  return (
    <AppLayout pageTitle="Preventive Maintenance Schedule" breadcrumb="PM PLANNING">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat
            label="Overdue"
            value={overdue}
            tone="crit"
            active={dueFilter === "overdue"}
            onClick={() => setDueFilter((f) => (f === "overdue" ? "all" : "overdue"))}
          />
          <Stat
            label="Due This Week"
            value={dueSoon}
            tone="warn"
            active={dueFilter === "due-soon"}
            onClick={() => setDueFilter((f) => (f === "due-soon" ? "all" : "due-soon"))}
          />
          <Stat label="Total Tracked" value={pmTasks.length} />
        </div>

        {overdue > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-led-crit/30 bg-led-crit/10 px-4 py-2.5 text-sm text-led-crit">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>{overdue}</strong> machine{overdue === 1 ? " is" : "s are"} overdue for preventive maintenance.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading>Machine PM Checklists</SectionHeading>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1">
              {freqFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFreqFilter(f.key)}
                  className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                    freqFilter === f.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              New PM Checklist
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sorted.length === 0 && (
            <Panel className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No PM checklists match this filter.</p>
            </Panel>
          )}
          {sorted.map((p) => {
            const days = pmDaysUntil(p.nextDue);
            const t = tone(days);
            const colorClass =
              t === "crit" ? "text-led-crit" : t === "warn" ? "text-led-warn" : "text-led-ok";
            const m = getMachine(p.machineId);
            const person = p.personInCharge ? getWorker(p.personInCharge) : null;
            const isOpen = expanded === p.id;
            const est = estimatedPMHours(p);

            return (
              <Panel key={p.id} className="overflow-hidden">
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="w-full text-left p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:bg-panel-elevated/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-data text-xs font-bold">{p.id}</span>
                      {p.referenceNumber && (
                        <span className="font-mono-data text-[9px] text-muted-foreground uppercase">
                          {p.referenceNumber}
                        </span>
                      )}
                      <span className="font-mono-data text-[10px] text-primary uppercase">
                        {freqLabel(p.frequency)}
                      </span>
                      <span className={`font-mono-data text-[10px] uppercase ${colorClass}`}>
                        {days <= 0 ? `${Math.abs(days)}d OVERDUE` : `IN ${days}d`}
                      </span>
                      <Badge variant="outline" className="text-[9px] gap-1">
                        <Timer className="size-2.5" />
                        Est. {est.hours.toFixed(1)}h
                        {est.source === "history" && ` · from ${p.history.length} visit${p.history.length === 1 ? "" : "s"}`}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-1">{p.task}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Link
                        to={`/machines/${p.machineId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary transition-colors"
                      >
                        {p.machineId}
                      </Link>
                      {m && <span>· {m.name}</span>}
                      {person && <span>· {person.name}</span>}
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
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button size="sm" onClick={() => setCompleteTarget(p)}>
                        <CheckCircle2 className="size-4" />
                        Log Completion
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setScheduleTarget(p)}>
                        <UserCog className="size-4" />
                        Schedule / Assign
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Detail label="Procedures / Checklist Notes" value={p.procedures} />
                      <Detail label="Required Tools" value={p.requiredTools} />
                      <Detail label="Safety Instructions" value={p.safetyInstructions} />
                      <Detail
                        label="Person in Charge"
                        value={person ? `${person.name} (${person.workerId})` : p.personInCharge ?? "Unassigned"}
                      />
                    </div>

                    <div className="pt-4">
                      <span className="font-mono-data text-[10px] text-primary uppercase tracking-widest">
                        Completion History
                      </span>
                      {p.history.length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-2">No completed visits logged yet.</p>
                      ) : (
                        <div className="mt-2 flex flex-col gap-2">
                          {p.history.map((h) => {
                            const who = getWorker(h.completedBy);
                            const ok = h.items.filter((i) => i.result === "ok").length;
                            const faulty = h.items.filter((i) => i.result === "faulty").length;
                            return (
                              <div
                                key={h.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-panel p-3 text-sm"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                                  <span className="font-medium">{h.completedAt.slice(0, 10)}</span>
                                  <span className="text-muted-foreground">
                                    · {who?.name ?? h.completedBy}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                  <span className="flex items-center gap-1">
                                    <Timer className="size-3" /> {h.durationHours?.toFixed(1) ?? "—"}h
                                  </span>
                                  <span className="text-led-ok">{ok} OK</span>
                                  {faulty > 0 && <span className="text-led-crit">{faulty} Faulty</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </div>

      {scheduleTarget && (
        <ScheduleDialog
          task={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onSaved={refresh}
        />
      )}
      {completeTarget && (
        <CompleteVisitDialog
          task={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onSaved={refresh}
        />
      )}
      {newOpen && (
        <NewPMDialog
          onClose={() => setNewOpen(false)}
          onSaved={() => {
            refresh();
            setNewOpen(false);
          }}
        />
      )}
    </AppLayout>
  );
}

function NewPMDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [machineId, setMachineId] = useState(machines[0]?.id ?? "");
  const [task, setTask] = useState("");
  const [frequency, setFrequency] = useState<PMFrequency>("monthly");
  const [nextDue, setNextDue] = useState(() => new Date().toISOString().slice(0, 10));
  const [personInCharge, setPersonInCharge] = useState("");
  const [procedures, setProcedures] = useState("");
  const [requiredTools, setRequiredTools] = useState("");
  const [safetyInstructions, setSafetyInstructions] = useState("");
  const [workshop, setWorkshop] = useState("");
  const [department, setDepartment] = useState("");

  const machine = machines.find((m) => m.id === machineId);
  const candidateWorkers = machine?.assignedTechnicians?.length
    ? machine.assignedTechnicians
    : technicians.map((t) => t.username);

  const save = () => {
    if (!task.trim()) {
      toast.error("Enter a task / checklist name");
      return;
    }
    const id = nextPMTaskId();
    addPMTask({
      id,
      referenceNumber: nextPMReferenceNumber(),
      machineId,
      task: task.trim(),
      frequency,
      intervalDays: FREQ_DAYS[frequency],
      lastDone: new Date().toISOString().slice(0, 10),
      nextDue,
      personInCharge: personInCharge || undefined,
      procedures: procedures.trim() || undefined,
      requiredTools: requiredTools.trim() || undefined,
      safetyInstructions: safetyInstructions.trim() || undefined,
      workshop: workshop.trim() || machine?.sector,
      department: department.trim() || undefined,
      scheduledBy: getUser() ?? undefined,
      checklist: buildPMChecklist(),
      history: [],
    });
    toast.success("PM checklist created", { description: id });
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New PM Checklist</DialogTitle>
          <DialogDescription>
            Create and assign a new preventive maintenance checklist for a machine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field label="Machine">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Task / Checklist Name">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Quarterly electrical safety inspection"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Frequency">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PMFrequency)}
              >
                {(["daily", "weekly", "monthly", "quarterly"] as PMFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {freqLabel(f)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next Due Date">
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </Field>
          </div>

          <Field label="Assigned Technician">
            <Input
              value={personInCharge}
              onChange={(e) => setPersonInCharge(e.target.value)}
              placeholder="Login username"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {candidateWorkers.map((u) => {
              const w = getWorker(u);
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => setPersonInCharge(u)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    personInCharge === u
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {w?.name ?? u}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Workshop">
              <Input
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                placeholder={machine?.sector ?? "e.g. Machine Shop"}
              />
            </Field>
            <Field label="Department">
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operations Maintenance"
              />
            </Field>
          </div>

          <Field label="Procedures / Checklist Notes">
            <Textarea rows={3} value={procedures} onChange={(e) => setProcedures(e.target.value)} />
          </Field>
          <Field label="Required Tools">
            <Textarea rows={2} value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} />
          </Field>
          <Field label="Safety Instructions">
            <Textarea rows={2} value={safetyInstructions} onChange={(e) => setSafetyInstructions(e.target.value)} />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            <Plus className="size-4" />
            Create PM Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({
  task,
  onClose,
  onSaved,
}: {
  task: PMTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [frequency, setFrequency] = useState<PMFrequency>(task.frequency ?? "monthly");
  const [nextDue, setNextDue] = useState(task.nextDue);
  const [personInCharge, setPersonInCharge] = useState(task.personInCharge ?? "");
  const [estimatedHours, setEstimatedHours] = useState(task.estimatedHours?.toString() ?? "");
  const [safetyInstructions, setSafetyInstructions] = useState(task.safetyInstructions ?? "");

  const machine = getMachine(task.machineId);
  const candidateWorkers = machine?.assignedTechnicians?.length
    ? machine.assignedTechnicians
    : technicians.map((t) => t.username);

  const save = () => {
    updatePMTask(task.id, {
      frequency,
      intervalDays: FREQ_DAYS[frequency],
      nextDue,
      personInCharge: personInCharge || undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      safetyInstructions: safetyInstructions.trim() || undefined,
      scheduledBy: getUser() ?? task.scheduledBy,
    });
    toast.success("PM schedule updated", { description: task.id });
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule &amp; Assign — {task.id}</DialogTitle>
          <DialogDescription>
            {task.task} · {machine?.name ?? task.machineId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Frequency">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PMFrequency)}
              >
                {(["daily", "weekly", "monthly", "quarterly"] as PMFrequency[]).map((f) => (
                  <option key={f} value={f}>
                    {freqLabel(f)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next Due Date">
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </Field>
          </div>

          <Field label="Assigned Technician">
            <Input
              value={personInCharge}
              onChange={(e) => setPersonInCharge(e.target.value)}
              placeholder="Login username"
            />
          </Field>

          {candidateWorkers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {candidateWorkers.map((u) => {
                const w = getWorker(u);
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setPersonInCharge(u)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      personInCharge === u
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {w?.name ?? u}
                  </button>
                );
              })}
            </div>
          )}

          <Field label="Estimated Duration Override (hours, optional)">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="Leave blank to use logged-visit average"
            />
          </Field>

          <Field label="Safety Instructions">
            <Textarea
              rows={3}
              value={safetyInstructions}
              onChange={(e) => setSafetyInstructions(e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteVisitDialog({
  task,
  onClose,
  onSaved,
}: {
  task: PMTask;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState<PMChecklistItem[]>(() => task.checklist.map((i) => ({ ...i })));
  const [completedBy, setCompletedBy] = useState(getUser() ?? task.personInCharge ?? "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [remarks, setRemarks] = useState("");

  const machine = getMachine(task.machineId);
  const sections = Array.from(new Set(items.map((i) => i.section)));

  const setResult = (id: string, result: PMChecklistItem["result"]) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, result } : i)));

  const durationHours = (() => {
    if (!startTime || !endTime) return null;
    const s = new Date(startTime).getTime();
    const e = new Date(endTime).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
    return (e - s) / 36e5;
  })();

  const save = () => {
    if (!completedBy.trim()) {
      toast.error("Enter who completed this visit");
      return;
    }
    completePMVisit(task.id, {
      completedAt: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
      completedBy: completedBy.trim(),
      startTime: startTime ? new Date(startTime).toISOString() : undefined,
      endTime: endTime ? new Date(endTime).toISOString() : undefined,
      durationHours: durationHours ?? undefined,
      items,
      remarks: remarks.trim() || undefined,
    });
    toast.success("PM visit logged", { description: task.id });
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Completion — {task.id}</DialogTitle>
          <DialogDescription>
            {task.task} · {machine?.name ?? task.machineId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Completed By">
              <Input
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
                placeholder="Login username"
              />
            </Field>
            <div />
            <Field label="Start Time">
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="End Time">
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>

          {durationHours !== null && (
            <div className="rounded-lg bg-panel p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-mono-data text-[10px] uppercase tracking-widest">
                Duration Logged
              </span>
              <span className="font-semibold">{durationHours.toFixed(1)} h</span>
            </div>
          )}

          {sections.map((section) => (
            <div key={section} className="space-y-2">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
                {section}
              </span>
              <div className="space-y-1.5">
                {items
                  .filter((i) => i.section === section)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-panel p-2.5"
                    >
                      <span className="text-sm flex-1">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <ResultButton
                          active={item.result === "ok"}
                          tone="ok"
                          icon={CheckCircle2}
                          onClick={() => setResult(item.id, "ok")}
                        />
                        <ResultButton
                          active={item.result === "faulty"}
                          tone="crit"
                          icon={AlertTriangle}
                          onClick={() => setResult(item.id, "faulty")}
                        />
                        <ResultButton
                          active={item.result === "na"}
                          tone="muted"
                          icon={MinusCircle}
                          onClick={() => setResult(item.id, "na")}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <Field label="Remarks">
            <Textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Notes, parts replaced, follow-up required..."
            />
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            <CheckCircle2 className="size-4" />
            Save Completion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultButton({
  active,
  tone,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  tone: "ok" | "crit" | "muted";
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  const activeClass =
    tone === "ok" ? "bg-led-ok text-white border-led-ok" : tone === "crit" ? "bg-led-crit text-white border-led-crit" : "bg-secondary text-secondary-foreground border-secondary";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`size-7 rounded-md border flex items-center justify-center transition-colors ${
        active ? activeClass : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="font-mono-data text-[10px] text-primary uppercase tracking-widest">
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
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "crit";
  active?: boolean;
  onClick?: () => void;
}) {
  const colorClass =
    tone === "crit"
      ? "text-led-crit"
      : tone === "warn"
      ? "text-led-warn"
      : "text-foreground";
  return (
    <Panel
      className={`p-5 h-28 flex flex-col justify-between transition-colors ${
        onClick ? "cursor-pointer hover:border-primary/40" : ""
      } ${active ? "border-primary" : ""}`}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="flex flex-col justify-between h-full w-full text-left"
      >
        <span className="font-mono-data text-[10px] text-primary uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="size-3" />
          {label}
        </span>
        <span className={`font-mono-data text-4xl font-bold ${colorClass}`}>
          {String(value).padStart(2, "0")}
        </span>
      </button>
    </Panel>
  );
}
