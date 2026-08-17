import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Save, Send, ShieldCheck, Undo2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ReporterLayout } from "@/components/ReporterLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { PrintableMaintenanceRequest } from "@/components/PrintableMaintenanceRequest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getUser, getUserRole } from "@/lib/auth";
import { getWorker, WORKERS } from "@/data/workers";
import { machines } from "@/data/cmms";
import {
  addMaintenanceRequest,
  canApproveRequest,
  getMaintenanceRequest,
  MaintenanceRequest,
  MaintenanceUrgency,
  nextMaintenanceJobNumber,
  routeSupervisorForDepartment,
  timeToFirstResponse,
  updateMaintenanceRequest,
  URGENCY_ORDER,
  urgencyHint,
  urgencyLabel,
} from "@/data/maintenanceRequests";

type FormMode = "create" | "view";

const STATUS_LABEL: Record<MaintenanceRequest["status"], string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted to WO",
};

const STATUS_BADGE: Record<MaintenanceRequest["status"], string> = {
  submitted: "bg-muted text-muted-foreground",
  approved: "bg-led-ok text-white",
  rejected: "bg-destructive text-destructive-foreground",
  converted: "bg-primary text-primary-foreground",
};

export default function MaintenanceRequestForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";
  const username = getUser() ?? "";
  const user = getWorker(username);
  const role = getUserRole();
  const isReporterUser = role === "reporter";
  const isSupervisorUser = role === "supervisor";

  const [tick, setTick] = useState(0);

  const mode: FormMode = id ? "view" : "create";
  const existing = useMemo(
    () => (id ? getMaintenanceRequest(id) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

  // Editable form state
  const [equipmentId, setEquipmentId] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [workshop, setWorkshop] = useState("");
  const [station, setStation] = useState("");
  const [operatorCustodianName, setOperatorCustodianName] = useState("");
  const [operatorCustodianDesignation, setOperatorCustodianDesignation] = useState("");

  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterDepartment, setRequesterDepartment] = useState("");
  const [requesterDesignation, setRequesterDesignation] = useState("");
  const [requestDateTime, setRequestDateTime] = useState(formatDateTimeLocal(new Date()));
  const [problemDescription, setProblemDescription] = useState("");
  const [requesterSignatureName, setRequesterSignatureName] = useState("");
  const [urgency, setUrgency] = useState<MaintenanceUrgency>("medium");

  const [supervisorSignatureName, setSupervisorSignatureName] = useState("");
  const [workOrderIssuedAt, setWorkOrderIssuedAt] = useState("");
  const [workOrderNumber, setWorkOrderNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Load existing request
  useEffect(() => {
    if (!existing) return;
    setEquipmentId(existing.equipmentId);
    setEquipmentName(existing.equipmentName);
    setWorkshop(existing.workshop);
    setStation(existing.station);
    setOperatorCustodianName(existing.operatorCustodianName);
    setOperatorCustodianDesignation(existing.operatorCustodianDesignation);
    setRequesterName(existing.requesterName);
    setRequesterEmail(existing.requesterEmail);
    setRequesterDepartment(existing.requesterDepartment);
    setRequesterDesignation(existing.requesterDesignation);
    setRequestDateTime(formatDateTimeLocal(new Date(existing.requestDateTime)));
    setProblemDescription(existing.problemDescription);
    setRequesterSignatureName(existing.requesterSignatureName);
    setUrgency(existing.urgency);
    setSupervisorSignatureName(existing.approval?.signatureName ?? "");
    setWorkOrderIssuedAt(existing.response.workOrderIssuedAt ? formatDateTimeLocal(new Date(existing.response.workOrderIssuedAt)) : "");
    setWorkOrderNumber(existing.response.workOrderNumber ?? "");
  }, [existing]);

  // Pre-fill requester from logged-in worker when creating
  useEffect(() => {
    if (mode !== "create" || !user) return;
    setRequesterName(user.name);
    setRequesterEmail(user.email ?? "");
    setRequesterDepartment(user.department);
    setRequesterDesignation(user.jobTitle);
    setOperatorCustodianName(user.name);
    setOperatorCustodianDesignation(user.jobTitle);
  }, [mode, user]);

  // Auto-print when opened from a print action
  useEffect(() => {
    if (autoPrint && mode === "view" && existing) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, mode, existing]);

  const selectedMachine = useMemo(() => machines.find((m) => m.id === equipmentId), [equipmentId]);

  // Auto-populate equipment fields when a machine is chosen
  useEffect(() => {
    if (!selectedMachine) return;
    setEquipmentId(selectedMachine.id);
    setEquipmentName(selectedMachine.name);
    setWorkshop(selectedMachine.sector);
    setStation(selectedMachine.line ?? selectedMachine.section ?? selectedMachine.plant);
  }, [selectedMachine]);

  const requesterLocked = mode === "view";
  const canApprove = existing ? canApproveRequest(user, existing) : false;
  const isApprover = isSupervisorUser && canApprove;
  const canEditResponse = isApprover;

  const pageTitle = mode === "create" ? "New Maintenance Request" : existing?.jobNumber ?? "Maintenance Request";
  const breadcrumb = mode === "create" ? "JOB REQUEST · MRF" : "JOB REQUEST · MRF";

  const content = (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to={isReporterUser ? "/report" : "/job-requests"}>
            <ArrowLeft className="size-4 mr-1" /> {isReporterUser ? "Back to console" : "All job requests"}
          </Link>
        </Button>

        <div className="flex items-center gap-2 no-print">
          {mode === "view" && existing && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4 mr-2" /> Print / Download PDF
            </Button>
          )}
        </div>
      </div>

      {mode === "view" && existing && (
        <Panel className="p-5 no-print">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge className={`text-[10px] ${STATUS_BADGE[existing.status]}`}>{STATUS_LABEL[existing.status]}</Badge>
            <span className="font-mono-data text-xs text-muted-foreground uppercase tracking-widest">
              Job {existing.jobNumber}
            </span>
            {existing.response.workOrderNumber && (
              <span className="font-mono-data text-xs text-muted-foreground">WO {existing.response.workOrderNumber}</span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide">Submitted</span>
              <span>{formatDateTime(existing.submittedAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide">Routed supervisor</span>
              <span>{getWorker(existing.routedSupervisorUsername)?.name ?? existing.routedSupervisorUsername}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wide">Time to first response</span>
              <span className="font-mono-data">{timeToFirstResponse(existing)}</span>
            </div>
          </div>
          {!isApprover && mode === "view" && isSupervisorUser && (
            <p className="mt-3 text-xs text-muted-foreground">
              You are not the supervisor assigned to this requester&apos;s department, so approval fields are read-only.
            </p>
          )}
        </Panel>
      )}

      <Panel className="p-5 md:p-6">
        <SectionHeading>Requester Information</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Name" locked={requesterLocked}>
            <Input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Email" locked={requesterLocked}>
            <Input type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Department" locked={requesterLocked}>
            <Input value={requesterDepartment} onChange={(e) => setRequesterDepartment(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Designation" locked={requesterLocked}>
            <Input value={requesterDesignation} onChange={(e) => setRequesterDesignation(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Date / Time of Request" locked={requesterLocked} className="md:col-span-2">
            <Input
              type="datetime-local"
              value={requestDateTime}
              onChange={(e) => setRequestDateTime(e.target.value)}
              disabled={requesterLocked}
              required
            />
          </Field>
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <SectionHeading>Equipment Information</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="Equipment" locked={requesterLocked} className="md:col-span-2">
            <Select
              value={equipmentId}
              onValueChange={(v) => {
                setEquipmentId(v);
                const m = machines.find((x) => x.id === v);
                if (m) {
                  setEquipmentName(m.name);
                  setWorkshop(m.sector);
                  setStation(m.line ?? m.section ?? m.plant);
                }
              }}
              disabled={requesterLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select equipment..." />
              </SelectTrigger>
              <SelectContent>
                {machines
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.id}) — {m.plant}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Machine / Equipment Name" locked={requesterLocked}>
            <Input value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Machine / Equipment ID" locked={requesterLocked}>
            <Input value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Workshop" locked={requesterLocked}>
            <Input value={workshop} onChange={(e) => setWorkshop(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Station" locked={requesterLocked}>
            <Input value={station} onChange={(e) => setStation(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Equipment Operator / Custodian" locked={requesterLocked}>
            <Input value={operatorCustodianName} onChange={(e) => setOperatorCustodianName(e.target.value)} disabled={requesterLocked} required />
          </Field>
          <Field label="Designation" locked={requesterLocked}>
            <Input value={operatorCustodianDesignation} onChange={(e) => setOperatorCustodianDesignation(e.target.value)} disabled={requesterLocked} required />
          </Field>
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <SectionHeading>Issue Description</SectionHeading>
        <div className="mt-4 space-y-4">
          <Field label="Problem Description" locked={requesterLocked}>
            <Textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              disabled={requesterLocked}
              rows={5}
              required
              placeholder="Describe the fault, when it started, and any immediate safety or production impact."
            />
          </Field>
          <Field label="Signature" locked={requesterLocked}>
            <Input
              value={requesterSignatureName}
              onChange={(e) => setRequesterSignatureName(e.target.value)}
              disabled={requesterLocked}
              placeholder="Type your first name as your signature"
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              This confirms your soft-copy submission. The printed form has a blank line for a physical signature.
            </p>
          </Field>
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <SectionHeading>Urgency Level</SectionHeading>
        <RadioGroup
          value={urgency}
          onValueChange={(v) => setUrgency(v as MaintenanceUrgency)}
          disabled={requesterLocked}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {URGENCY_ORDER.map((u) => (
            <div
              key={u.value}
              className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-colors ${
                requesterLocked ? "opacity-70" : "hover:bg-panel-elevated"
              } ${urgency === u.value ? "bg-secondary/40 border-primary/40" : ""}`}
            >
              <RadioGroupItem value={u.value} id={`urgency-${u.value}`} disabled={requesterLocked} className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor={`urgency-${u.value}`} className="cursor-pointer font-medium">
                  {u.label}
                </Label>
                <p className="text-xs text-muted-foreground">{u.hint}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </Panel>

      {/* Approval section */}
      <Panel className="p-5 md:p-6">
        <SectionHeading>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Supervisor Approval
          </span>
        </SectionHeading>

        {mode === "view" && existing?.approval && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide block">Supervisor</span>
              <span>{existing.approval.supervisorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide block">Department</span>
              <span>{existing.approval.supervisorDepartment}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase tracking-wide block">Approved at</span>
              <span>{formatDateTime(existing.approval.approvedAt)}</span>
            </div>
          </div>
        )}

        <div className={`mt-4 ${isApprover ? "" : "opacity-80 pointer-events-none"}`}>
          <Field label="Supervisor Signature" locked={!isApprover}>
            <Input
              value={supervisorSignatureName}
              onChange={(e) => setSupervisorSignatureName(e.target.value)}
              disabled={!isApprover}
              placeholder={!isApprover ? "Awaiting supervisor signature" : "Type your first name as your signature"}
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              This confirms your soft-copy approval. The printed form has a blank line for a physical signature.
            </p>
          </Field>
        </div>

        {mode === "create" && (
          <p className="mt-4 text-xs text-muted-foreground">
            Once submitted, this request will be routed to the supervisor of {requesterDepartment || "your department"} for approval.
          </p>
        )}
      </Panel>

      {/* Response tracking section */}
      <Panel className="p-5 md:p-6">
        <SectionHeading>Response Tracking</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1.5">Request Received</span>
            <Input value={mode === "view" && existing ? formatDateTime(existing.response.receivedAt ?? existing.submittedAt) : "—"} disabled />
          </div>
          <Field label="Work Order Issued (date/time)" locked={!canEditResponse}>
            <Input
              type="datetime-local"
              value={workOrderIssuedAt}
              onChange={(e) => setWorkOrderIssuedAt(e.target.value)}
              disabled={!canEditResponse}
            />
          </Field>
          <Field label="Work Order Number" locked={!canEditResponse} className="md:col-span-2">
            <Input
              value={workOrderNumber}
              onChange={(e) => setWorkOrderNumber(e.target.value)}
              disabled={!canEditResponse}
              placeholder="e.g. WO-2091"
            />
          </Field>
          <div className="md:col-span-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1.5">Time to First Response</span>
            <Input value={mode === "view" && existing ? timeToFirstResponse(existing) : "—"} disabled />
          </div>
        </div>
      </Panel>

      <Separator className="my-2 no-print" />

      <div className="flex flex-wrap items-center justify-end gap-3 no-print">
        {mode === "create" ? (
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            <Send className="size-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Maintenance Request"}
          </Button>
        ) : (
          isApprover && (
            <>
              <Button variant="outline" size="sm" onClick={handleReject} disabled={submitting}>
                <Undo2 className="size-4 mr-2" /> Reject
              </Button>
              <Button size="lg" onClick={handleApprove} disabled={submitting}>
                <Save className="size-4 mr-2" />
                {submitting ? "Saving..." : "Approve & Save"}
              </Button>
            </>
          )
        )}
      </div>

    </div>
  );

  const wrapped = isReporterUser ? (
    <ReporterLayout pageTitle={pageTitle}>{content}</ReporterLayout>
  ) : (
    <AppLayout pageTitle={pageTitle} breadcrumb={breadcrumb}>
      {content}
    </AppLayout>
  );

  if (mode === "view" && !existing) {
    return (
      <AppLayout pageTitle="Not Found" breadcrumb="JOB REQUEST">
        <Panel className="p-8 text-center max-w-xl mx-auto">
          <p className="text-muted-foreground text-sm">
            Maintenance request <span className="font-mono-data">{id}</span> not found.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/job-requests">Back to requests</Link>
          </Button>
        </Panel>
      </AppLayout>
    );
  }

  return (
    <>
      <div className="screen-only">{wrapped}</div>
      {existing && <PrintableMaintenanceRequest request={existing} />}
    </>
  );

  function validateCreate(): boolean {
    if (!requesterName.trim()) return toastError("Requester name is required");
    if (!requesterEmail.trim()) return toastError("Requester email is required");
    if (!requesterDepartment.trim()) return toastError("Department is required");
    if (!requesterDesignation.trim()) return toastError("Designation is required");
    if (!equipmentId.trim() || !equipmentName.trim()) return toastError("Please select equipment");
    if (!workshop.trim()) return toastError("Workshop is required");
    if (!station.trim()) return toastError("Station is required");
    if (!operatorCustodianName.trim()) return toastError("Operator / custodian name is required");
    if (!operatorCustodianDesignation.trim()) return toastError("Operator / custodian designation is required");
    if (!problemDescription.trim()) return toastError("Problem description is required");
    if (!requesterSignatureName.trim()) return toastError("Requester signature is required");
    return true;
  }

  function handleSubmit() {
    if (!validateCreate()) return;
    setSubmitting(true);

    const supervisor = routeSupervisorForDepartment(requesterDepartment);
    if (!supervisor) {
      toast.error("No supervisor found for the selected department.");
      setSubmitting(false);
      return;
    }

    const now = new Date().toISOString();
    const jobNumber = nextMaintenanceJobNumber();

    const req: MaintenanceRequest = {
      id: jobNumber,
      jobNumber,
      status: "submitted",
      submittedAt: now,
      submittedBy: username,
      requesterName,
      requesterEmail,
      requesterDepartment,
      requesterDesignation,
      requestDateTime: new Date(requestDateTime).toISOString() || now,
      requesterSignatureName,
      requesterSignedAt: now,
      equipmentName,
      equipmentId,
      workshop,
      station,
      operatorCustodianName,
      operatorCustodianDesignation,
      problemDescription,
      urgency,
      routedSupervisorUsername: supervisor.username,
      response: {
        receivedAt: now,
        firstResponseAt: undefined,
      },
    };

    addMaintenanceRequest(req);
    toast.success("Maintenance request submitted", { description: jobNumber });
    setSubmitting(false);
    // Reporters stay in the operator portal; supervisors/admin go to the requests list.
    const detailPath = isReporterUser
      ? `/report/maintenance/${jobNumber}`
      : `/job-requests/maintenance/${jobNumber}`;
    navigate(detailPath);
  }

  function handleApprove() {
    if (!existing) return;
    if (!supervisorSignatureName.trim()) {
      toast.error("Supervisor signature is required to approve.");
      return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    updateMaintenanceRequest(existing.id, {
      status: "approved",
      approval: {
        supervisorName: user?.name ?? username,
        supervisorUsername: username,
        supervisorDepartment: user?.department ?? "",
        signatureName: supervisorSignatureName,
        approvedAt: now,
      },
      response: {
        ...existing.response,
        firstResponseAt: existing.response.firstResponseAt ?? now,
        workOrderIssuedAt: workOrderIssuedAt ? new Date(workOrderIssuedAt).toISOString() : existing.response.workOrderIssuedAt,
        workOrderNumber: workOrderNumber || existing.response.workOrderNumber,
      },
    });
    toast.success("Request approved", { description: existing.jobNumber });
    setTick((t) => t + 1);
    setSubmitting(false);
  }

  function handleReject() {
    if (!existing) return;
    setSubmitting(true);
    updateMaintenanceRequest(existing.id, { status: "rejected" });
    toast.info("Request rejected", { description: existing.jobNumber });
    setTick((t) => t + 1);
    setSubmitting(false);
  }
}

function Field({
  label,
  children,
  locked,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  locked?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <Label className={locked ? "text-muted-foreground" : ""}>
        {label}
        {locked && <span className="ml-1 text-xs text-muted-foreground">(locked)</span>}
      </Label>
      {children}
    </div>
  );
}

function toastError(message: string): false {
  toast.error(message);
  return false;
}

function formatDateTimeLocal(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
