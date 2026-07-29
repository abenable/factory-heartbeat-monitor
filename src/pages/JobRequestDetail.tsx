import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, CheckCircle2, Plus, Wrench, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { jobRequests, updateJobRequest, JobRequestStatus } from "@/data/jobRequests";
import { addWorkOrder, getMachine } from "@/data/cmms";
import { isViewer } from "@/lib/auth";
import { toast } from "sonner";

const STATUS_LABEL: Record<JobRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  converted: "Converted",
};

export default function JobRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewer = isViewer();
  const [tick, setTick] = useState(0);

  const request = useMemo(
    () => jobRequests.find((r) => r.id === id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
  );

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

  const convert = () => {
    if (viewer || request.status === "converted") return;
    const workOrderId = `WO-${Math.floor(2000 + Math.random() * 8000)}`;
    addWorkOrder({
      id: workOrderId,
      title: request.description.slice(0, 60),
      machineId: request.equipmentId,
      status: "open",
      priority: request.priority === "urgent" ? "high" : "medium",
      type: "corrective",
      assignee: "Unassigned",
      department: "",
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      problemDescription: request.description,
      tasks: [{ description: "Assess reported issue" }],
      authorizedBy: "Supervisor",
    });
    updateJobRequest(request.id, { status: "converted" });
    setTick((t) => t + 1);
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
                <Button onClick={convert} disabled={viewer} size="sm">
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
    </AppLayout>
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
