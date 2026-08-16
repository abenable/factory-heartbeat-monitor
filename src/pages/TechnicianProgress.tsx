import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Wrench } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { workOrders, getMachine, WorkOrder, WorkOrderPriority } from "@/data/cmms";
import { WORKERS, WorkerProfile } from "@/data/workers";
import {
  WorkOrderDetailDialog,
  priorityTone,
  statusMeta,
  woProgress,
  progressTone,
} from "@/components/WorkOrderDetailDialog";

interface TechAggregate {
  wos: WorkOrder[];
  total: number;
  active: number;
  done: number;
  overdue: number;
  percent: number;
}

function technicianAggregate(username: string): TechAggregate {
  const wos = workOrders.filter((w) => w.assignee.toLowerCase() === username.toLowerCase());
  const totalTasks = wos.reduce((s, w) => s + w.tasks.length, 0);
  const doneTasks = wos.reduce((s, w) => s + w.tasks.filter((t) => t.completed).length, 0);
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const overdue = wos.filter(
    (w) => w.status !== "done" && new Date(w.dueAt).getTime() < Date.now(),
  ).length;
  return {
    wos,
    total: wos.length,
    active: wos.filter((w) => w.status !== "done").length,
    done: wos.filter((w) => w.status === "done").length,
    overdue,
    percent,
  };
}

const TechnicianProgress = () => {
  const [selectedTech, setSelectedTech] = useState<WorkerProfile | null>(null);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  const technicians = useMemo(() => {
    const list = Object.values(WORKERS).filter(
      (w) => w.role !== "supervisor" && w.role !== "viewer" && w.role !== "reporter",
    );
    const withAgg = list.map((w) => ({ worker: w, agg: technicianAggregate(w.username) }));
    withAgg.sort((a, b) => {
      if (b.agg.overdue !== a.agg.overdue) return b.agg.overdue - a.agg.overdue;
      if (a.agg.total === 0 && b.agg.total === 0) return a.worker.name.localeCompare(b.worker.name);
      if (a.agg.total === 0) return 1;
      if (b.agg.total === 0) return -1;
      return a.agg.percent - b.agg.percent;
    });
    return withAgg;
  }, []);

  const totalActive = technicians.reduce((s, t) => s + t.agg.active, 0);
  const totalOverdue = technicians.reduce((s, t) => s + t.agg.overdue, 0);
  const withWork = technicians.filter((t) => t.agg.total > 0);
  const avgPercent = withWork.length
    ? Math.round(withWork.reduce((s, t) => s + t.agg.percent, 0) / withWork.length)
    : 0;

  return (
    <AppLayout pageTitle="Technician Progress" breadcrumb="WORKFORCE / PROGRESS">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Technicians" value={technicians.length} icon={Wrench} tone="default" />
        <SummaryCard label="Active Work Orders" value={totalActive} icon={Clock} tone="default" />
        <SummaryCard
          label="Overdue"
          value={totalOverdue}
          icon={AlertTriangle}
          tone={totalOverdue > 0 ? "warn" : "default"}
        />
        <SummaryCard label="Avg Completion" value={avgPercent} unit="%" icon={CheckCircle2} tone="ok" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {technicians.map(({ worker, agg }) => (
          <TechnicianCard
            key={worker.username}
            worker={worker}
            agg={agg}
            onClick={() => setSelectedTech(worker)}
          />
        ))}
      </div>

      {selectedTech && !selectedWO && (
        <TechnicianWorkOrdersDialog
          worker={selectedTech}
          wos={technicianAggregate(selectedTech.username).wos}
          onClose={() => setSelectedTech(null)}
          onSelectWO={(wo) => setSelectedWO(wo)}
        />
      )}

      {selectedWO && (
        <WorkOrderDetailDialog
          wo={selectedWO}
          onBack={() => setSelectedWO(null)}
          onClose={() => {
            setSelectedWO(null);
            setSelectedTech(null);
          }}
        />
      )}
    </AppLayout>
  );
};

function TechnicianCard({
  worker,
  agg,
  onClick,
}: {
  worker: WorkerProfile;
  agg: TechAggregate;
  onClick: () => void;
}) {
  const hasWork = agg.total > 0;
  const tone = progressTone(agg.percent, agg.overdue > 0);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-border/60 transition-shadow hover:shadow-md hover:border-primary/40"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{worker.name}</CardTitle>
            <span className="text-xs text-muted-foreground truncate block">{worker.jobTitle}</span>
          </div>
          <div
            className={`size-12 rounded-full border-2 flex items-center justify-center font-mono-data text-xs font-bold shrink-0 ${
              hasWork ? `${tone.replace("bg-", "border-")} text-foreground` : "border-border text-muted-foreground"
            }`}
          >
            {hasWork ? `${agg.percent}%` : "—"}
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${tone}`}
            style={{ width: `${hasWork ? agg.percent : 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
          <span>{agg.active} Active</span>
          <span>{agg.done} Done</span>
          {agg.overdue > 0 ? (
            <span className="text-led-crit flex items-center gap-1">
              <AlertTriangle className="size-3" /> {agg.overdue} Overdue
            </span>
          ) : (
            <span>0 Overdue</span>
          )}
        </div>

        {!hasWork && (
          <p className="text-xs text-muted-foreground mt-3">No work orders assigned.</p>
        )}
      </CardContent>
    </Card>
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
              {String(value).padStart(2, "0")}
              {unit}
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

function TechnicianWorkOrdersDialog({
  worker,
  wos,
  onClose,
  onSelectWO,
}: {
  worker: WorkerProfile;
  wos: WorkOrder[];
  onClose: () => void;
  onSelectWO: (wo: WorkOrder) => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{worker.name}</DialogTitle>
          <DialogDescription>
            {worker.jobTitle} · {wos.length} assigned work order{wos.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {wos.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No work orders currently assigned to this technician.
            </p>
          )}
          {wos.map((wo) => {
            const progress = woProgress(wo);
            const machine = getMachine(wo.machineId);
            const meta = statusMeta[wo.status];
            const overdue = wo.status !== "done" && new Date(wo.dueAt).getTime() < Date.now();
            return (
              <button
                key={wo.id}
                type="button"
                onClick={() => onSelectWO(wo)}
                className="w-full text-left rounded-lg border border-border/60 bg-panel p-3 hover:border-primary/40 hover:bg-panel-elevated transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono-data text-[10px] uppercase tracking-widest text-primary shrink-0">
                      {wo.referenceNumber ?? wo.id}
                    </span>
                    {wo.type === "preventive" && (
                      <Badge className="text-[9px] bg-led-ok/15 text-led-ok border border-led-ok/30 shrink-0">
                        Preventive
                      </Badge>
                    )}
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${priorityTone[wo.priority]}`}>{wo.priority}</Badge>
                </div>
                <div className="text-sm font-medium mb-1 truncate">{wo.title}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="truncate">{machine?.name ?? wo.machineId}</span>
                  <span className={`flex items-center gap-1 shrink-0 ${meta.color}`}>
                    <meta.icon className="size-3" />
                    {meta.label}
                    {overdue && <span className="text-led-crit ml-1">· Overdue</span>}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressTone(progress.percent, overdue)}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <div className="flex justify-end text-[10px] text-muted-foreground mt-1 font-mono-data">
                  {progress.done}/{progress.total} tasks · {progress.percent}%
                </div>
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TechnicianProgress;
