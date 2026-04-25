import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, Save, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  machines,
  addWorkOrder,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/data/cmms";
import { toast } from "@/hooks/use-toast";

const priorities: WorkOrderPriority[] = ["low", "medium", "high", "critical"];
const statuses: WorkOrderStatus[] = ["open", "in_progress", "blocked", "done"];
const strategies = ["Corrective", "Preventive", "Predictive", "Condition-based"];
const equipmentStatuses = ["Running", "Idle", "Down", "Under Maintenance"];

const NewWorkOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: `WO-${Math.floor(2000 + Math.random() * 8000)}`,
    machineId: machines[0]?.id ?? "",
    workArea: "",
    equipmentStatus: equipmentStatuses[0],
    maintenanceStrategy: strategies[0],
    assignee: "",
    estimatedHours: "",
    numberOfWorkers: "",
    title: "",
    priority: "medium" as WorkOrderPriority,
    status: "open" as WorkOrderStatus,
    dueAt: "",
    comments: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const buildWO = (): WorkOrder => ({
    id: form.id.trim(),
    title: form.title.trim() || "Untitled work order",
    machineId: form.machineId,
    status: form.status,
    priority: form.priority,
    assignee: form.assignee.trim() || "Unassigned",
    createdAt: new Date().toISOString(),
    dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : new Date().toISOString(),
    workArea: form.workArea.trim() || undefined,
    equipmentStatus: form.equipmentStatus,
    maintenanceStrategy: form.maintenanceStrategy,
    estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
    numberOfWorkers: form.numberOfWorkers ? Number(form.numberOfWorkers) : undefined,
    comments: form.comments.trim() || undefined,
  });

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    addWorkOrder(buildWO());
    toast({ title: "Work order saved", description: form.id });
    navigate("/work-orders");
  };

  const onPrint = () => {
    // Save first so the print view reflects the same record.
    window.print();
  };

  const machine = machines.find((m) => m.id === form.machineId);

  return (
    <AppLayout pageTitle="New Work Order" breadcrumb="WORK ORDERS / CREATE">
      <form onSubmit={onSave} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/work-orders")}
          >
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

        <SectionHeading>Work Order Details</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          <Field label="Work Order Number">
            <Input value={form.id} onChange={(e) => update("id", e.target.value)} required />
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
          <Field label="Work Area / Location">
            <Input
              value={form.workArea}
              onChange={(e) => update("workArea", e.target.value)}
              placeholder={machine?.sector ?? "e.g. Sector 3 — South Wing"}
            />
          </Field>
          <Field label="Equipment Status">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.equipmentStatus}
              onChange={(e) => update("equipmentStatus", e.target.value)}
            >
              {equipmentStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Maintenance Strategy">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.maintenanceStrategy}
              onChange={(e) => update("maintenanceStrategy", e.target.value)}
            >
              {strategies.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Technician">
            <Input
              value={form.assignee}
              onChange={(e) => update("assignee", e.target.value)}
              placeholder="Full name"
            />
          </Field>
          <Field label="Estimated Work Hours">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={form.estimatedHours}
              onChange={(e) => update("estimatedHours", e.target.value)}
            />
          </Field>
          <Field label="Number of Workers">
            <Input
              type="number"
              min="1"
              step="1"
              value={form.numberOfWorkers}
              onChange={(e) => update("numberOfWorkers", e.target.value)}
            />
          </Field>
          <Field label="Title / Task Summary">
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
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
          <Field label="Due Date / Time">
            <Input
              type="datetime-local"
              value={form.dueAt}
              onChange={(e) => update("dueAt", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Comments">
              <Textarea
                rows={4}
                value={form.comments}
                onChange={(e) => update("comments", e.target.value)}
                placeholder="Additional notes, parts needed, safety considerations..."
              />
            </Field>
          </div>
        </Panel>

        {/* Printable report — only visible when printing */}
        <div className="print-only">
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>
            Group 6 Industries Limited — Work Order
          </h1>
          <p style={{ marginBottom: 16, color: "#444" }}>
            Printed {new Date().toLocaleString()}
          </p>
          <table>
            <tbody>
              <PrintRow label="Work Order #" value={form.id} />
              <PrintRow
                label="Equipment"
                value={`${form.machineId}${machine ? ` — ${machine.name}` : ""}`}
              />
              <PrintRow label="Work Area" value={form.workArea || machine?.sector || "—"} />
              <PrintRow label="Equipment Status" value={form.equipmentStatus} />
              <PrintRow label="Maintenance Strategy" value={form.maintenanceStrategy} />
              <PrintRow label="Technician" value={form.assignee || "—"} />
              <PrintRow
                label="Estimated Hours"
                value={form.estimatedHours || "—"}
              />
              <PrintRow
                label="Number of Workers"
                value={form.numberOfWorkers || "—"}
              />
              <PrintRow label="Title" value={form.title || "—"} />
              <PrintRow label="Priority" value={form.priority.toUpperCase()} />
              <PrintRow
                label="Status"
                value={form.status.replace("_", " ").toUpperCase()}
              />
              <PrintRow
                label="Due"
                value={form.dueAt ? new Date(form.dueAt).toLocaleString() : "—"}
              />
            </tbody>
          </table>
          <div style={{ marginTop: 16 }}>
            <strong>Comments</strong>
            <div
              style={{
                minHeight: 80,
                border: "1px solid #999",
                marginTop: 6,
                padding: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {form.comments || " "}
            </div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 32 }}>
            <SignatureLine label="Technician signature" />
            <SignatureLine label="Supervisor signature" />
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string | number }) {
  return (
    <tr>
      <th style={{ width: 180, textAlign: "left" }}>{label}</th>
      <td>{value}</td>
    </tr>
  );
}

function SignatureLine({ label }: { label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ borderBottom: "1px solid #000", height: 40 }} />
      <small>{label}</small>
    </div>
  );
}

export default NewWorkOrder;
