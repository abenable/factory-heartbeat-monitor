import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  Hourglass,
  Loader2,
  MessageSquare,
  PauseCircle,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getMachine,
  woTypeLabel,
  woStatusLabel,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
} from "@/data/cmms";

export const priorityTone: Record<WorkOrderPriority, string> = {
  emergency: "bg-led-crit text-white",
  urgent: "bg-led-warn text-white",
  normal: "bg-primary text-primary-foreground",
  low: "bg-secondary text-secondary-foreground",
};

export const statusMeta: Record<
  WorkOrderStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  open: { label: "Open", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-primary" },
  blocked: { label: "Blocked", icon: PauseCircle, color: "text-led-warn" },
  done: { label: "Done", icon: CheckCircle2, color: "text-led-ok" },
};

export function woProgress(wo: WorkOrder) {
  const total = wo.tasks.length || 1;
  const done = wo.tasks.filter((t) => t.completed).length;
  return { done, total, percent: Math.round((done / total) * 100) };
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function durationHours(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  return (e - s) / 36e5;
}

export function formatDurationHours(start?: string, end?: string): string {
  const hours = durationHours(start, end);
  return hours === null ? "—" : `${hours.toFixed(1)} h`;
}

export function progressTone(percent: number, overdue: boolean) {
  if (overdue) return "bg-led-crit";
  if (percent >= 75) return "bg-led-ok";
  if (percent >= 40) return "bg-led-warn";
  return "bg-primary";
}

/**
 * Read-only work order detail — full drill-down (status, task checklist,
 * work log observations/parts/challenges/comments, uploaded photos). Used
 * from any supervisor-facing list where a work order can be clicked into.
 * Pass `onBack` to show a "Back" button (e.g. returning to a parent list
 * dialog); omit it for a plain "Close" footer.
 */
export function WorkOrderDetailDialog({
  wo,
  onClose,
  onBack,
}: {
  wo: WorkOrder;
  onClose: () => void;
  onBack?: () => void;
}) {
  const machine = getMachine(wo.machineId);
  const progress = woProgress(wo);
  const workLog = wo.workLog;
  const hasLogEntries =
    workLog &&
    (workLog.observations || workLog.partsUsed || workLog.challengesFaced || workLog.comments ||
      (workLog.images && workLog.images.length > 0));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              {wo.referenceNumber ?? wo.id}
            </span>
            {wo.referenceNumber && (
              <span className="font-mono-data text-[9px] uppercase tracking-widest text-muted-foreground">
                {wo.id}
              </span>
            )}
            {wo.type === "preventive" && (
              <Badge className="text-[10px] bg-led-ok/15 text-led-ok border border-led-ok/30">
                Preventive Maintenance
              </Badge>
            )}
            <Badge className={`text-[10px] ${priorityTone[wo.priority]}`}>{wo.priority}</Badge>
          </div>
          <DialogTitle className="text-left text-xl leading-tight">{wo.title}</DialogTitle>
          <DialogDescription className="text-left">
            {machine?.name ?? wo.machineId} · Assigned to {wo.assignee}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Status strip (read-only) */}
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-panel p-1">
            {(["open", "in_progress", "blocked", "done"] as WorkOrderStatus[]).map((s) => {
              const active = wo.status === s;
              return (
                <div
                  key={s}
                  className={`flex flex-col items-center gap-1 rounded-md py-2 text-[10px] font-mono-data uppercase tracking-wider ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {statusMeta[s].label}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-mono-data uppercase tracking-widest">
                Task Progress
              </span>
              <span className="font-medium">
                {progress.done}/{progress.total} · {progress.percent}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressTone(progress.percent, false)}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Due Date" value={formatDate(wo.dueAt)} icon={CalendarClock} />
            <Meta label="Department" value={wo.department ?? "—"} icon={ClipboardList} />
            <Meta label="Type" value={woTypeLabel(wo.type)} icon={Hourglass} />
            <Meta label="Status" value={woStatusLabel(wo.status)} icon={CheckCircle2} />
            <Meta
              label="Receipt Confirmed"
              value={wo.acknowledgedAt ? `${wo.acknowledgedByName} · ${formatDate(wo.acknowledgedAt)}` : "Not yet confirmed"}
              icon={CheckCircle2}
            />
          </div>

          {/* Problem */}
          {wo.problemDescription && (
            <div className="rounded-lg bg-panel p-3 text-sm">
              <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary block mb-1">
                Problem Description
              </span>
              <p className="text-muted-foreground leading-relaxed">{wo.problemDescription}</p>
            </div>
          )}

          {/* Task checklist (read-only) */}
          <div className="space-y-3">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              Task Checklist
            </span>
            <div className="space-y-2">
              {wo.tasks.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-panel p-3"
                >
                  {t.completed ? (
                    <CheckCircle2 className="size-4 text-led-ok mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${t.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {t.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Work log (read-only) */}
          <div className="space-y-3">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
              Work Log
            </span>
            <div className="grid gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Meta label="Actual Start" value={formatDateTime(workLog?.actualStartTime)} icon={Timer} />
                <Meta
                  label="Actual Completion"
                  value={formatDateTime(workLog?.actualCompletionTime)}
                  icon={CheckCircle2}
                />
              </div>

              <div className="rounded-lg bg-panel p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-mono-data text-[10px] uppercase tracking-widest">
                  Total Repair Time
                </span>
                <span className="font-semibold text-foreground">
                  {formatDurationHours(workLog?.actualStartTime, workLog?.actualCompletionTime)}
                </span>
              </div>

              {workLog?.observations && (
                <ReadField label="Observations / Findings" value={workLog.observations} icon={ClipboardList} />
              )}
              {workLog?.partsUsed && <ReadField label="Parts Used" value={workLog.partsUsed} />}
              {workLog?.challengesFaced && (
                <ReadField label="Challenges / Blockers Faced" value={workLog.challengesFaced} icon={AlertTriangle} />
              )}
              {workLog?.comments && (
                <ReadField label="Comments" value={workLog.comments} icon={MessageSquare} />
              )}

              {workLog?.images && workLog.images.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    Job Photos ({workLog.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {workLog.images.map((img, i) => (
                      <a
                        key={i}
                        href={img.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-lg border border-border bg-panel overflow-hidden block hover:opacity-90 transition-opacity"
                      >
                        <img src={img.dataUrl} alt={img.name} className="size-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!hasLogEntries && (
                <p className="text-sm text-muted-foreground">No work log entries yet.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function ReadField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg bg-panel p-3">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </span>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
