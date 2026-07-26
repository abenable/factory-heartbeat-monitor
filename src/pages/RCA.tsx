import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { machines } from "@/data/cmms";

const RCA = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    equipment: machines[0]?.name ?? "",
    equipmentId: machines[0]?.id ?? "",
    problem: "",
    cause: "",
    causeOfCause: "",
    whyTheCause: "",
    actionTaken: "",
    recommendation: "",
    comment: "",
    technician: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.print();
  };

  return (
    <AppLayout pageTitle="Root Cause Analysis" breadcrumb="MAINTENANCE / RCA">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 no-print">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="submit" size="sm">
            <Printer className="size-4" />
            Print RCA Report
          </Button>
        </div>

        <SectionHeading>RCA Inputs</SectionHeading>
        <Panel className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
          <Field label="Equipment">
            <Input
              value={form.equipment}
              onChange={(e) => update("equipment", e.target.value)}
              required
            />
          </Field>
          <Field label="Equipment ID">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.equipmentId}
              onChange={(e) => {
                const m = machines.find((x) => x.id === e.target.value);
                update("equipmentId", e.target.value);
                if (m) update("equipment", m.name);
              }}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Technician">
            <Input
              value={form.technician}
              onChange={(e) => update("technician", e.target.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Problem / Fault">
              <Textarea
                rows={2}
                value={form.problem}
                onChange={(e) => update("problem", e.target.value)}
                required
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Cause of fault">
              <Textarea
                rows={2}
                value={form.cause}
                onChange={(e) => update("cause", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="What caused the cause">
              <Textarea
                rows={2}
                value={form.causeOfCause}
                onChange={(e) => update("causeOfCause", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Why the cause">
              <Textarea
                rows={2}
                value={form.whyTheCause}
                onChange={(e) => update("whyTheCause", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="What was done">
              <Textarea
                rows={2}
                value={form.actionTaken}
                onChange={(e) => update("actionTaken", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Recommendation">
              <Textarea
                rows={2}
                value={form.recommendation}
                onChange={(e) => update("recommendation", e.target.value)}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Comment">
              <Textarea
                rows={2}
                value={form.comment}
                onChange={(e) => update("comment", e.target.value)}
              />
            </Field>
          </div>
        </Panel>

        {/* Printable report */}
        <div className="print-only">
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>
            Kiira Motors Corporation — Root Cause Analysis
          </h1>
          <p style={{ marginBottom: 16, color: "#444" }}>
            Printed {new Date().toLocaleString()}
          </p>
          <table>
            <tbody>
              <PrintRow label="Equipment" value={form.equipment} />
              <PrintRow label="Equipment ID" value={form.equipmentId} />
              <PrintRow label="Technician" value={form.technician || "—"} />
            </tbody>
          </table>
          <PrintBlock label="Problem / Fault" value={form.problem} />
          <PrintBlock label="Cause of fault" value={form.cause} />
          <PrintBlock label="What caused the cause" value={form.causeOfCause} />
          <PrintBlock label="Why the cause" value={form.whyTheCause} />
          <PrintBlock label="What was done" value={form.actionTaken} />
          <PrintBlock label="Recommendation" value={form.recommendation} />
          <PrintBlock label="Comment" value={form.comment} />
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
      <Label className="font-mono-data text-[10px] uppercase tracking-widest text-primary">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PrintRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th style={{ width: 160, textAlign: "left" }}>{label}</th>
      <td>{value}</td>
    </tr>
  );
}

function PrintBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <strong>{label}</strong>
      <div
        style={{
          minHeight: 50,
          border: "1px solid #999",
          marginTop: 4,
          padding: 8,
          whiteSpace: "pre-wrap",
        }}
      >
        {value || " "}
      </div>
    </div>
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

export default RCA;
