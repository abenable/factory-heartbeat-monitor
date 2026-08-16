import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, CheckCircle2, Plus, Wrench, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { jobRequests, updateJobRequest, JobRequestStatus } from "@/data/jobRequests";
import {
  addWorkOrder,
  getMachine,
  WorkOrderPriority,
  WorkOrderType,
} from "@/data/cmms";
import { getCraftsByWorker, SKILL_LABELS, LEVEL_LABELS } from "@/data/crafts";
import { getWorker } from "@/data/workers";
import { getUser, isViewer } from "@/lib/auth";
import { toast } from "sonner";

const STATUS_LABEL: Record<JobRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  converted: "Converted",
};

const priorities: WorkOrderPriority[] = ["low", "medium", "high", "critical"];
const woTypes: WorkOrderType[] = ["corrective", "preventive", "predictive", "condition-based"];

function defaultDueAt(): string {
  const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function JobRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewer = isViewer();
  const [tick, setTick] = useState(0);
  const [convertOpen, setConvertOpen] = useState(false);

  const request = useMemo(
    () => jobRequests.find((r) => r.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

  const supervisor = getWorker(getUser() ?? "")?.name ?? "Supervisor";

  const [form, setForm] = useState(() => ({
    title: "",
    priority: "medium" as WorkOrderPriority,
    type: "corrective" as WorkOrderType,
    assignee: "",
    department: "",
    dueAt: defaultDueAt(),
    problemDescription: "",
    authorizedBy: supervisor,
  }));

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (!request) {
    return (
      <AppLayout pageTitle="Job Request" breadcrumb="NOT FOUND">
        <Panel className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Job request <span className="font-mono-data">{id}</span> not found.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/job-requests">Back to requests</Link>
          </Button>
        </Panel>
      </AppLayout>
    );
  }

  const machine = getMachine(request.equipmentId);
  const candidateWorkers = machine?.assignedTechnicians?.length
    ? machine.assignedTechnicians
    : [];

  const openConvertDialog = () => {
    if (viewer || request.status === "converted") return;
    setForm({
      title: request.description.slice(0, 60),
      priority: request.priority === "urgent" ? "high" : "medium",
      type: "corrective",
      assignee: "",
      department: machine?.sector ?? "",
      dueAt: defaultDueAt(),
      problemDescription: request.description,
      authorizedBy: supervisor,
    });
    setConvertOpen(true);
  };

  const confirmConvert = () => {
    const workOrderId = `WO-${Math.floor(2000 + Math.random() * 8000)}`;
    addWorkOrder({
      id: workOrderId,
      title: form.title.trim() || request.description.slice(0, 60),
      machineId: request.equipmentId,
      status: "open",
      priority: form.priority,
      type: form.type,
      assignee: form.assignee.trim() || "Unassigned",
      department: form.department.trim() || undefined,
      createdAt: new Date().toISOString(),
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : new Date().toISOString(),
      problemDescription: form.problemDescription.trim() || request.description,
      tasks: [{ description: "Assess reported issue" }],
      authorizedBy: form.authorizedBy.trim() || supervisor,
    });
    updateJobRequest(request.id, { status: "converted" });
    setTick((t) => t + 1);
    setConvertOpen(false);
    toast.success("Converted to work order", { description: workOrderId });
  };

  return (
    <AppLayout pageTitle={request.id} breadcrumb="JOB REQUEST">
      <div className="flex flex-col gap-6">
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/job-requests">
            <ArrowLeft className="size-4 mr-1" /> All job requests
          </Link>
        </Button>

        <Panel className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-data text-xs text-primary uppercase tracking-widest">
                  {request.id}
                </span>
                <Badge
                  variant={request.status === "converted" ? "outline" : "default"}
                  className="text-[10px]"
                >
                  {STATUS_LABEL[request.status]}
                </Badge>
                {request.priority === "urgent" && (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertTriangle className="size-3 mr-1" /> Urgent
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-semibold">{request.description}</h1>
              <p className="text-sm text-muted-foreground">
                Raised {formatDateTime(request.requestedAt)} by <span className="font-medium text-foreground">{request.requester}</span>
                {" "}· Plant: {request.plant}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {request.status !== "converted" && (
                <Button onClick={openConvertDialog} disabled={viewer} size="sm">
                  <Plus className="size-4 mr-1" /> Convert to Work Order
                </Button>
              )}
              {request.status === "converted" && (
                <Badge className="h-9 px-3 border border-border text-muted-foreground" variant="outline">
                  <CheckCircle2 className="size-4 mr-1" /> Converted
                </Badge>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to={`/machines/${request.equipmentId}`}>
                  <Wrench className="size-4 mr-1" /> View Equipment
                </Link>
              </Button>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel className="p-5">
            <SectionHeading>Equipment</SectionHeading>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                <Link to={`/machines/${request.equipmentId}`} className="font-medium hover:underline">
                  {request.equipmentName}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">ID:</span>{" "}
                <span className="font-mono-data">{request.equipmentId}</span>
              </p>
              {machine && (
                <p>
                  <span className="text-muted-foreground">Sector:</span>{" "}
                  {machine.sector}
                </p>
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHeading>Request Details</SectionHeading>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Priority:</span>{" "}
                <span className="capitalize">{request.priority}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {STATUS_LABEL[request.status]}
              </p>
              <p>
                <span className="text-muted-foreground">Plant:</span>{" "}
                {request.plant}
              </p>
            </div>
          </Panel>
        </div>

        {request.images && request.images.length > 0 && (
          <Panel className="p-5">
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Camera className="size-4 text-primary" /> Attached Photos
              </span>
            </SectionHeading>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-3">
              {request.images.map((src, idx) => (
                <a
                  key={idx}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="aspect-square rounded-lg border border-border bg-panel overflow-hidden hover:opacity-90 transition-opacity"
                >
                  <img
                    src={src}
                    alt={`Attachment ${idx + 1}`}
                    className="size-full object-cover"
                  />
                </a>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert to Work Order</DialogTitle>
            <DialogDescription>
              Review and adjust the details below before creating the work order for{" "}
              <span className="font-mono-data">{request.id}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <Field label="Title / Task Summary">
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(e) => update("priority", e.target.value as WorkOrderPriority)}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Work Order Type">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as WorkOrderType)}
                >
                  {woTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Technician / Assignee">
                <Input
                  value={form.assignee}
                  onChange={(e) => update("assignee", e.target.value)}
                  placeholder="Login username (leave blank for Unassigned)"
                />
              </Field>
              <Field label="Department">
                <Input
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  placeholder="e.g. Mechanical Maintenance"
                />
              </Field>
            </div>

            {candidateWorkers.length > 0 && (
              <div>
                <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary mb-1.5 block">
                  Suggested Technicians (assigned to {machine?.name ?? request.equipmentId})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {candidateWorkers.map((u) => {
                    const worker = getWorker(u);
                    const cs = getCraftsByWorker(u);
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => update("assignee", u)}
                        className={`text-left text-xs px-3 py-2 rounded-full border transition-colors ${
                          form.assignee === u
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        <span className="font-medium">{worker?.name ?? u}</span>
                        {cs.length > 0 && (
                          <span className="block font-mono-data text-[9px] opacity-80 mt-0.5">
                            {cs.map((c) => `${SKILL_LABELS[c.skill]} · ${LEVEL_LABELS[c.level]}`).join(", ")}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Due Date / Time">
                <Input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => update("dueAt", e.target.value)}
                />
              </Field>
              <Field label="Authorized By">
                <Input
                  value={form.authorizedBy}
                  onChange={(e) => update("authorizedBy", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Problem Description">
              <Textarea
                rows={3}
                value={form.problemDescription}
                onChange={(e) => update("problemDescription", e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmConvert}>
              <Plus className="size-4 mr-1" /> Create Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
