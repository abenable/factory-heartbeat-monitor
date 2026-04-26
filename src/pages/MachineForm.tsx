import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { isViewer } from "@/lib/auth";
import { Save, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  machines,
  addMachine,
  updateMachine,
  getMachine,
  Machine,
  MachineStatus,
} from "@/data/cmms";
import { ALLOWED_USERNAMES, getWorker } from "@/data/workers";
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

  const toggleTechnician = (username: string) => {
    const current = form.assignedTechnicians ?? [];
    const next = current.includes(username)
      ? current.filter((u) => u !== username)
      : [...current, username];
    update("assignedTechnicians", next.length ? next : undefined);
  };

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
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="submit" size="sm">
            <Save className="size-4" />
            {isEdit ? "Save Changes" : "Create Machine"}
          </Button>
        </div>

        {/* 1. Core Identity */}
        <SectionHeading>Asset Identification</SectionHeading>
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
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </Field>
          <Field label="Type">
            <Input value={form.type} onChange={(e) => update("type", e.target.value)} required />
          </Field>
          <Field label="Manufacturer">
            <Input
              value={form.manufacturer ?? ""}
              onChange={(e) => update("manufacturer", e.target.value.trim() || undefined)}
              placeholder="e.g. Komatsu Industries"
            />
          </Field>
          <Field label="Model Number">
            <Input
              value={form.modelNumber ?? ""}
              onChange={(e) => update("modelNumber", e.target.value.trim() || undefined)}
              placeholder="e.g. HPF-4000-X"
            />
          </Field>
          <Field label="Serial Number">
            <Input
              value={form.serialNumber ?? ""}
              onChange={(e) => update("serialNumber", e.target.value.trim() || undefined)}
              placeholder="e.g. KI-HP-2019-004412"
            />
          </Field>
        </Panel>

        {/* 2. Location & Installation */}
        <SectionHeading>Location &amp; Installation</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Sector / Physical Location">
            <Input
              value={form.sector}
              onChange={(e) => update("sector", e.target.value)}
              placeholder="e.g. Sector 7 — North Wing"
              required
            />
          </Field>
          <Field label="Plant">
            <Input
              value={form.plant ?? ""}
              onChange={(e) => update("plant", e.target.value.trim() || undefined)}
              placeholder="e.g. Kampala Main Plant"
            />
          </Field>
          <Field label="Section">
            <Input
              value={form.section ?? ""}
              onChange={(e) => update("section", e.target.value.trim() || undefined)}
              placeholder="e.g. Press Line A"
            />
          </Field>
          <Field label="Line">
            <Input
              value={form.line ?? ""}
              onChange={(e) => update("line", e.target.value.trim() || undefined)}
              placeholder="e.g. Line 3"
            />
          </Field>
          <Field label="Installation Date">
            <Input
              type="date"
              value={form.installationDate ?? ""}
              onChange={(e) => update("installationDate", e.target.value || undefined)}
            />
          </Field>
          <Field label="Commissioning Date">
            <Input
              type="date"
              value={form.commissioningDate ?? ""}
              onChange={(e) => update("commissioningDate", e.target.value || undefined)}
            />
          </Field>
        </Panel>

        {/* 3. Technical Specifications */}
        <SectionHeading>Technical Specifications</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Power Rating">
            <Input
              value={form.powerRating ?? ""}
              onChange={(e) => update("powerRating", e.target.value.trim() || undefined)}
              placeholder="e.g. 75 kW"
            />
          </Field>
          <Field label="Capacity">
            <Input
              value={form.capacity ?? ""}
              onChange={(e) => update("capacity", e.target.value.trim() || undefined)}
              placeholder="e.g. 4,000 kN"
            />
          </Field>
          <Field label="Speed">
            <Input
              value={form.speed ?? ""}
              onChange={(e) => update("speed", e.target.value.trim() || undefined)}
              placeholder="e.g. 14 strokes/min"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Operating Parameters">
              <Textarea
                rows={2}
                value={form.operatingParameters ?? ""}
                onChange={(e) =>
                  update("operatingParameters", e.target.value.trim() || undefined)
                }
                placeholder="e.g. Pressure 3800–4500 PSI, Temp ≤ 60°C"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Design Limits">
              <Textarea
                rows={2}
                value={form.designLimits ?? ""}
                onChange={(e) => update("designLimits", e.target.value.trim() || undefined)}
                placeholder="e.g. Max pressure 5,200 PSI, Max temp 85°C"
              />
            </Field>
          </div>
        </Panel>

        {/* 4. Maintenance Information */}
        <SectionHeading>Maintenance Information</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Maintenance Procedures / Checklists">
              <Textarea
                rows={3}
                value={form.maintenanceProcedures ?? ""}
                onChange={(e) =>
                  update("maintenanceProcedures", e.target.value.trim() || undefined)
                }
                placeholder="e.g. Daily oil-level check. Weekly filter inspection..."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Required Tools">
              <Textarea
                rows={2}
                value={form.requiredTools ?? ""}
                onChange={(e) => update("requiredTools", e.target.value.trim() || undefined)}
                placeholder="e.g. Hydraulic gauge set, torque wrench, dial indicator"
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Safety Instructions">
              <Textarea
                rows={2}
                value={form.safetyInstructions ?? ""}
                onChange={(e) =>
                  update("safetyInstructions", e.target.value.trim() || undefined)
                }
                placeholder="e.g. Lockout-tagout required. Wear face shield..."
              />
            </Field>
          </div>
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
        </Panel>

        {/* 5. Telemetry */}
        <SectionHeading>Live Telemetry</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* 6. Assigned Personnel */}
        <SectionHeading>Assigned Technicians</SectionHeading>
        <Panel className="p-5">
          <div className="flex flex-wrap gap-2">
            {ALLOWED_USERNAMES.map((u) => {
              const worker = getWorker(u);
              const checked = (form.assignedTechnicians ?? []).includes(u);
              return (
                <label
                  key={u}
                  className={`cursor-pointer select-none px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                    checked
                      ? "border-foreground bg-panel-elevated text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleTechnician(u)}
                  />
                  {worker?.name ?? u}
                </label>
              );
            })}
          </div>
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
