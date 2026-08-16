import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { isViewer } from "@/lib/auth";
import { Printer, Save, ArrowLeft, Plus, X, Wrench } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  machines,
  addWorkOrder,
  nextWorkOrderReferenceNumber,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/data/cmms";
import {
  getCraftsByWorker,
  SKILL_LABELS,
  LEVEL_LABELS,
} from "@/data/crafts";
import { getWorker } from "@/data/workers";
import { getUser } from "@/lib/auth";
import { PrintableWorkOrder } from "@/components/PrintableWorkOrder";
import { toast } from "@/hooks/use-toast";

const priorities: WorkOrderPriority[] = ["low", "medium", "high", "critical"];
const statuses: WorkOrderStatus[] = ["open", "in_progress", "blocked", "done"];
const woTypes: WorkOrderType[] = ["corrective", "preventive", "predictive", "condition-based"];

function emptyForm() {
  const idSuffix = Math.floor(2000 + Math.random() * 8000);
  const requester = getWorker(getUser());
  return {
    id: `WO-${idSuffix}`,
    referenceNumber: nextWorkOrderReferenceNumber(),
    machineId: machines[0]?.id ?? "",
    title: "",
    priority: "medium" as WorkOrderPriority,
    status: "open" as WorkOrderStatus,
    type: "corrective" as WorkOrderType,
    assignee: "",
    department: "",
    dueAt: "",
    startDate: "",
    expectedCompletion: "",
    problemDescription: "",
    taskInputs: [""] as string[],
    toolsInput: "",
    sparePartsInput: "",
    ppeInput: "",
    authorizedBy: "Nakimbugwe",
    comments: "",
    requestorName: requester?.name ?? "",
    requestorEmail: requester?.email ?? "",
    requestorDesignation: requester?.jobTitle ?? "",
    workshop: "",
  };
}

const NewWorkOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm());

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const machine = machines.find((m) => m.id === form.machineId);

  const candidateWorkers = machine?.assignedTechnicians?.length
    ? machine.assignedTechnicians
    : [];

  const buildWO = (): WorkOrder => {
    const tasks = form.taskInputs
      .map((t) => t.trim())
      .filter(Boolean)
      .map((desc) => ({ description: desc }));

    return {
      id: form.id.trim(),
      referenceNumber: form.referenceNumber.trim() || undefined,
      title: form.title.trim() || "Untitled work order",
      machineId: form.machineId,
      status: form.status,
      priority: form.priority,
      type: form.type,
      assignee: form.assignee.trim() || "Unassigned",
      department: form.department.trim() || undefined,
      createdAt: new Date().toISOString(),
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : new Date().toISOString(),
      problemDescription: form.problemDescription.trim() || undefined,
      tasks: tasks.length ? tasks : [{ description: "General maintenance task" }],
      schedule:
        form.startDate || form.expectedCompletion
          ? {
              startDate: form.startDate
                ? new Date(form.startDate).toISOString()
                : new Date().toISOString(),
              expectedCompletion: form.expectedCompletion
                ? new Date(form.expectedCompletion).toISOString()
                : new Date().toISOString(),
            }
          : undefined,
      resources:
        form.toolsInput || form.sparePartsInput || form.ppeInput
          ? {
              tools: splitLines(form.toolsInput),
              spareParts: splitLines(form.sparePartsInput),
              ppe: splitLines(form.ppeInput),
            }
          : undefined,
      authorizedBy: form.authorizedBy.trim() || undefined,
      comments: form.comments.trim() || undefined,
      requestorName: form.requestorName.trim() || undefined,
      requestorEmail: form.requestorEmail.trim() || undefined,
      requestorDesignation: form.requestorDesignation.trim() || undefined,
      workshop: form.workshop.trim() || undefined,
    };
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    addWorkOrder(buildWO());
    toast({ title: "Work order saved", description: form.id });
    navigate("/work-orders");
  };

  const onPrint = () => window.print();

  const addTask = () => update("taskInputs", [...form.taskInputs, ""]);
  const removeTask = (idx: number) =>
    update(
      "taskInputs",
      form.taskInputs.filter((_, i) => i !== idx),
    );
  const updateTask = (idx: number, val: string) => {
    const next = [...form.taskInputs];
    next[idx] = val;
    update("taskInputs", next);
  };

  return (
    <AppLayout pageTitle="New Work Order" breadcrumb="WORK ORDERS / CREATE">
      <form onSubmit={onSave} className="flex flex-col gap-6 max-w-5xl">
      {/* Everything the supervisor edits on screen — hidden entirely when printing,
          so only the PrintableWorkOrder template below comes out of the printer. */}
      <div className="no-print flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/work-orders")}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button type="submit" size="sm">
              <Save className="size-4" />
              Save Work Order
            </Button>
          </div>
        </div>

        {/* Header */}
        <SectionHeading>Work Order Details</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <Field label="Work Order Number">
            <Input value={form.id} onChange={(e) => update("id", e.target.value)} required />
          </Field>
          <Field label="Reference Number (Auto-generated)">
            <Input value={form.referenceNumber} readOnly disabled className="font-mono-data" />
          </Field>
          <Field label="Equipment">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.machineId}
              onChange={(e) => update("machineId", e.target.value)}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name}
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
          <Field label="Title / Task Summary">
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </Field>
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
          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => update("status", e.target.value as WorkOrderStatus)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        </Panel>

        {/* Requestor */}
        <SectionHeading>Requestor Information</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          <Field label="Requestor Name">
            <Input value={form.requestorName} onChange={(e) => update("requestorName", e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.requestorEmail}
              onChange={(e) => update("requestorEmail", e.target.value)}
              placeholder="name@kiiramotors.com"
            />
          </Field>
          <Field label="Designation">
            <Input value={form.requestorDesignation} onChange={(e) => update("requestorDesignation", e.target.value)} placeholder="e.g. Production Line Operator" />
          </Field>
          <Field label="Workshop">
            <Input value={form.workshop} onChange={(e) => update("workshop", e.target.value)} placeholder="e.g. Press Shop - Station 3" />
          </Field>
        </Panel>

        {/* Asset snapshot */}
        <Panel className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">Machine:</strong> {machine?.name ?? "—"}
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">Location:</strong> {machine?.sector ?? "—"}
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">Manufacturer:</strong>{" "}
              {machine?.manufacturer ?? "—"}
            </span>
            {machine?.assignedTechnicians && machine.assignedTechnicians.length > 0 && (
              <span className="text-muted-foreground">
                <strong className="text-foreground">Assigned Techs:</strong>{" "}
                {machine.assignedTechnicians
                  .map((u) => getWorker(u)?.name ?? u)
                  .join(", ")}
              </span>
            )}
          </div>
        </Panel>

        {/* Problem Description */}
        <SectionHeading>Problem Description</SectionHeading>
        <Panel className="p-5 no-print">
          <Textarea
            rows={4}
            value={form.problemDescription}
            onChange={(e) => update("problemDescription", e.target.value)}
            placeholder="Describe the fault, anomaly, or maintenance trigger..."
          />
        </Panel>

        {/* Task Description */}
        <SectionHeading>Task Description</SectionHeading>
        <Panel className="p-5 flex flex-col gap-3 no-print">
          {form.taskInputs.map((task, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="font-mono-data text-xs text-muted-foreground pt-3 w-6">
                {idx + 1}.
              </span>
              <Input
                value={task}
                onChange={(e) => updateTask(idx, e.target.value)}
                placeholder={`Step ${idx + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => removeTask(idx)}
                disabled={form.taskInputs.length <= 1}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={addTask}>
            <Plus className="size-4" />
            Add Task
          </Button>
        </Panel>

        {/* Assignment */}
        <SectionHeading>Assignment &amp; Schedule</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          <Field label="Technician / Assignee">
            <Input
              value={form.assignee}
              onChange={(e) => update("assignee", e.target.value)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Department">
            <Input
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="e.g. Mechanical Maintenance"
            />
          </Field>
          <Field label="Start Date / Time">
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </Field>
          <Field label="Expected Completion">
            <Input
              type="datetime-local"
              value={form.expectedCompletion}
              onChange={(e) => update("expectedCompletion", e.target.value)}
            />
          </Field>
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
              placeholder="Maintenance Supervisor"
            />
          </Field>
        </Panel>

        {/* Crafts suggestion panel */}
        {candidateWorkers.length > 0 && (
          <div>
            <SectionHeading>
              <span className="flex items-center gap-2">
                <Wrench className="size-3.5" />
                Suggested Technicians (by Machine Assignment)
              </span>
            </SectionHeading>
            <Panel className="p-5">
              <div className="flex flex-wrap gap-2">
                {candidateWorkers.map((u) => {
                  const worker = getWorker(u);
                  const cs = getCraftsByWorker(u);
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => update("assignee", worker?.name ?? u)}
                      className="text-left text-xs px-3 py-2 bg-primary text-primary-foreground border border-primary rounded-full hover:opacity-90 transition-opacity"
                    >
                      <span className="font-medium">{worker?.name ?? u}</span>
                      {cs.length > 0 && (
                        <span className="block font-mono-data text-[9px] text-muted-foreground mt-0.5">
                          {cs.map((c) => `${SKILL_LABELS[c.skill]} · ${LEVEL_LABELS[c.level]}`).join(", ")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>
        )}

        {/* Required Resources */}
        <SectionHeading>Required Resources</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          <div>
            <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary mb-1.5 block">
              Tools
            </Label>
            <Textarea
              rows={4}
              value={form.toolsInput}
              onChange={(e) => update("toolsInput", e.target.value)}
              placeholder="One per line&#10;e.g.&#10;Bearing puller set&#10;Torque wrench"
            />
          </div>
          <div>
            <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary mb-1.5 block">
              Spare Parts
            </Label>
            <Textarea
              rows={4}
              value={form.sparePartsInput}
              onChange={(e) => update("sparePartsInput", e.target.value)}
              placeholder="One per line&#10;e.g.&#10;Spindle bearing 7208 (×4)&#10;High-temp grease"
            />
          </div>
          <div>
            <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary mb-1.5 block">
              PPE
            </Label>
            <Textarea
              rows={4}
              value={form.ppeInput}
              onChange={(e) => update("ppeInput", e.target.value)}
              placeholder="One per line&#10;e.g.&#10;Heat-resistant gloves&#10;Safety goggles"
            />
          </div>
        </Panel>

        {/* Comments */}
        <SectionHeading>Additional Comments</SectionHeading>
        <Panel className="p-5 no-print">
          <Textarea
            rows={4}
            value={form.comments}
            onChange={(e) => update("comments", e.target.value)}
            placeholder="Notes, safety considerations, approvals..."
          />
        </Panel>
      </div>

        {/* Printable report — matches the physical Maintenance Work Order Form */}
        <PrintableWorkOrder wo={buildWO()} />
      </form>
    </AppLayout>
  );
};

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

function splitLines(input: string): string[] {
  return input
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const NewWorkOrderGuarded = () => (isViewer() ? <Navigate to="/work-orders" replace /> : <NewWorkOrder />);
export default NewWorkOrderGuarded;
