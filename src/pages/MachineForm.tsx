import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  machines,
  addMachine,
  updateMachine,
  getMachine,
  Machine,
  MachineStatus,
} from "@/data/cmms";
import { toast } from "sonner";

const statuses: MachineStatus[] = ["running", "idle", "down", "maintenance"];

function emptyMachine(): Machine {
  return {
    id: "",
    name: "",
    type: "",
    sector: "",
    status: "idle",
    load: 0,
    temp: 0,
    uptime: 100,
    lastService: new Date().toISOString().slice(0, 10),
    nextService: new Date().toISOString().slice(0, 10),
    runtimeHours: 0,
  };
}

const MachineForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const existing = id ? getMachine(id) : undefined;

  const [form, setForm] = useState<Machine>(emptyMachine());

  useEffect(() => {
    if (existing) {
      setForm({ ...existing });
    }
  }, [existing]);

  const update = <K extends keyof Machine>(k: K, v: Machine[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    const machineId = form.id.trim();
    if (!machineId) {
      toast.error("Node ID is required.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Machine name is required.");
      return;
    }
    if (!form.type.trim()) {
      toast.error("Machine type is required.");
      return;
    }
    if (!form.sector.trim()) {
      toast.error("Sector is required.");
      return;
    }

    if (isEdit) {
      if (!existing) {
        toast.error("Machine not found.");
        return;
      }
      const idx = machines.findIndex((m) => m.id === id);
      if (idx === -1) {
        toast.error("Machine not found.");
        return;
      }
      // If ID changed, make sure it doesn't collide
      if (machineId !== id && machines.some((m) => m.id === machineId)) {
        toast.error(`A machine with ID "${machineId}" already exists.`);
        return;
      }
      updateMachine(id!, { ...form, id: machineId });
      toast.success(`Machine ${machineId} updated.`);
      navigate(`/machines/${machineId}`);
    } else {
      if (machines.some((m) => m.id === machineId)) {
        toast.error(`A machine with ID "${machineId}" already exists.`);
        return;
      }
      addMachine({ ...form, id: machineId });
      toast.success(`Machine ${machineId} created.`);
      navigate(`/machines/${machineId}`);
    }
  };

  return (
    <AppLayout
      pageTitle={isEdit ? "Edit Machine" : "New Machine"}
      breadcrumb={isEdit ? `MACHINES / ${id} / EDIT` : "MACHINES / CREATE"}
    >
      <form onSubmit={onSave} className="flex flex-col gap-6 max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="submit" size="sm">
            <Save className="size-4" />
            {isEdit ? "Save Changes" : "Create Machine"}
          </Button>
        </div>

        <SectionHeading>Machine Details</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Node ID">
            <Input
              value={form.id}
              onChange={(e) => update("id", e.target.value)}
              placeholder="e.g. STAMP-PR-01"
              required
              disabled={isEdit && !existing}
            />
          </Field>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Hydraulic Press T5"
              required
            />
          </Field>
          <Field label="Type">
            <Input
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              placeholder="e.g. Hydraulic Press"
              required
            />
          </Field>
          <Field label="Sector">
            <Input
              value={form.sector}
              onChange={(e) => update("sector", e.target.value)}
              placeholder="e.g. Sector 7 — North Wing"
              required
            />
          </Field>
          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => update("status", e.target.value as MachineStatus)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Load (%)">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.load}
              onChange={(e) => update("load", Number(e.target.value))}
            />
          </Field>
          <Field label="Core Temp (°C)">
            <Input
              type="number"
              step="0.1"
              value={form.temp}
              onChange={(e) => update("temp", Number(e.target.value))}
            />
          </Field>
          <Field label="Uptime 30d (%)">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.uptime}
              onChange={(e) => update("uptime", Number(e.target.value))}
            />
          </Field>
          <Field label="Pressure (PSI)">
            <Input
              type="number"
              step="1"
              value={form.pressure ?? ""}
              onChange={(e) =>
                update("pressure", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Vibration (mm/s)">
            <Input
              type="number"
              step="0.01"
              value={form.vibration ?? ""}
              onChange={(e) =>
                update("vibration", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Cycle Time (s)">
            <Input
              type="number"
              step="0.1"
              value={form.cycleTime ?? ""}
              onChange={(e) =>
                update("cycleTime", e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Error Code">
            <Input
              value={form.errorCode ?? ""}
              onChange={(e) =>
                update("errorCode", e.target.value.trim() || undefined)
              }
              placeholder="Optional"
            />
          </Field>
          <Field label="Last Service">
            <Input
              type="date"
              value={form.lastService}
              onChange={(e) => update("lastService", e.target.value)}
            />
          </Field>
          <Field label="Next Service">
            <Input
              type="date"
              value={form.nextService}
              onChange={(e) => update("nextService", e.target.value)}
            />
          </Field>
          <Field label="Runtime Hours">
            <Input
              type="number"
              min="0"
              step="1"
              value={form.runtimeHours}
              onChange={(e) => update("runtimeHours", Number(e.target.value))}
            />
          </Field>
        </Panel>
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

export default MachineForm;
