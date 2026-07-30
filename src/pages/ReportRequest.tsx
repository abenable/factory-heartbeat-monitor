import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Send, CheckCircle2, AlertTriangle, Inbox, FileText, ExternalLink } from "lucide-react";
import { ReporterLayout } from "@/components/ReporterLayout";
import { ImageUpload, ImageAttachment } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import { addJobRequest, jobRequests, JobRequest } from "@/data/jobRequests";
import { maintenanceRequests, MaintenanceRequest, urgencyLabel } from "@/data/maintenanceRequests";
import { machines } from "@/data/cmms";

function nextJobRequestId(): string {
  const nums = jobRequests
    .map((j) => Number(j.id.replace(/^JR-/, "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return `JR-${String(max + 1).padStart(4, "0")}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

export default function ReportRequest() {
  const username = getUser() ?? "";
  const worker = getWorker(username);

  const sortedMachines = useMemo(
    () => [...machines].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const recentMrf = useMemo(
    () =>
      maintenanceRequests
        .filter((m) => m.submittedBy === username || m.requesterName === (worker?.name ?? username))
        .slice(0, 5),
    [username, worker?.name],
  );

  const [equipmentId, setEquipmentId] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState<JobRequest[]>(() =>
    jobRequests.filter((r) => r.requester === (worker?.name ?? username)),
  );

  const selectedMachine = sortedMachines.find((m) => m.id === equipmentId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedMachine) {
      toast.error("Please select equipment");
      setSubmitting(false);
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe the challenge");
      setSubmitting(false);
      return;
    }

    const request: JobRequest = {
      id: nextJobRequestId(),
      requestedAt: new Date().toISOString(),
      requester: worker?.name ?? username,
      description: description.trim(),
      equipmentId: selectedMachine.id,
      equipmentName: selectedMachine.name,
      status: "new",
      priority,
      plant: selectedMachine.plant,
      images: images.map((i) => i.dataUrl),
    };

    addJobRequest(request);
    toast.success("Request sent to supervisor", {
      description: `${request.id} · ${selectedMachine.name}`,
    });

    setEquipmentId("");
    setPriority("normal");
    setDescription("");
    setImages([]);
    setRecent((prev) => [request, ...prev]);
    setSubmitting(false);
  };

  return (
    <ReporterLayout pageTitle="Report a Job Request">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Send a maintenance request</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Describe the challenge on the line and attach a photo so the supervisor can
                  understand and prioritise it.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-1.5">
                <Label htmlFor="equipment">Equipment</Label>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger id="equipment" className="w-full">
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedMachines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.id}) — {m.plant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as "normal" | "urgent")}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="description">
                  Describe the challenge
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is wrong? When did it start? Is production stopped?"
                  rows={5}
                  required
                />
              </div>

              <ImageUpload
                value={images}
                onChange={setImages}
                label="Attach photo"
                description="Optional: add an image of the problem or the area affected."
                maxCount={3}
              />

              {submitting ? (
                <Button disabled className="w-full">
                  Sending...
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="size-4 mr-2" /> Send to Supervisor
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Inbox className="size-4 text-primary" />
                Your recent requests
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  You have not submitted any requests yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recent.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border/60 bg-panel p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono-data text-xs text-primary font-bold">
                          {r.id}
                        </span>
                        <Badge
                          variant={r.priority === "urgent" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {r.priority}
                        </Badge>
                      </div>
                      <p className="text-foreground line-clamp-2 mb-1">{r.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{r.equipmentName}</span>
                        <span>{relativeTime(r.requestedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Maintenance Request Forms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {recentMrf.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  You have not submitted any maintenance request forms yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentMrf.map((m) => (
                    <Link
                      key={m.id}
                      to={`/report/maintenance/${m.id}`}
                      className="block rounded-lg border border-border/60 bg-panel p-3 text-sm hover:bg-panel-elevated transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono-data text-xs text-primary font-bold">
                          {m.jobNumber}
                        </span>
                        <Badge
                          variant={m.urgency === "critical" || m.urgency === "high" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {urgencyLabel(m.urgency)}
                        </Badge>
                      </div>
                      <p className="text-foreground line-clamp-2 mb-1">{m.problemDescription}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{m.equipmentName}</span>
                        <span>{relativeTime(m.submittedAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full mt-4">
                <Link to="/report/maintenance/new">
                  <ExternalLink className="size-4 mr-2" /> Open Maintenance Request Form
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-panel">
            <CardContent className="p-4">
              <div className="flex gap-3 text-sm">
                {priority === "urgent" ? (
                  <>
                    <AlertTriangle className="size-5 text-led-warn shrink-0" />
                    <p className="text-muted-foreground">
                      Use <span className="font-medium text-foreground">Urgent</span> only when
                      the issue stops production or creates a safety risk.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5 text-led-ok shrink-0" />
                    <p className="text-muted-foreground">
                      The supervisor will review normal requests and convert them into work
                      orders in the order they are received.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ReporterLayout>
  );
}
