import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Printer } from "lucide-react";
import { ReporterLayout } from "@/components/ReporterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import { maintenanceRequests, urgencyLabel } from "@/data/maintenanceRequests";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted to WO",
};

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-muted text-muted-foreground",
  approved: "bg-led-ok text-white",
  rejected: "bg-destructive text-destructive-foreground",
  converted: "bg-primary text-primary-foreground",
};

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

  const myRequests = useMemo(
    () =>
      maintenanceRequests
        .filter((m) => m.submittedBy === username || m.requesterName === (worker?.name ?? username))
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [username, worker?.name],
  );

  return (
    <ReporterLayout pageTitle="My Requests">
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Maintenance requests you've submitted from this console, with their approval and response status.
          </p>
          <Button asChild size="sm">
            <Link to="/report">
              <Plus className="size-4 mr-1" /> New Request
            </Link>
          </Button>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {myRequests.length} Maintenance Request{myRequests.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {myRequests.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  You have not submitted any maintenance requests yet.
                </p>
                <Button asChild size="sm">
                  <Link to="/report">
                    <Plus className="size-4 mr-1" /> Submit a Maintenance Request
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-border/60 bg-panel p-3 text-sm hover:bg-panel-elevated transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Link
                        to={`/report/maintenance/${m.id}`}
                        className="font-mono-data text-xs text-primary font-bold hover:underline"
                      >
                        {m.jobNumber}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(`/report/maintenance/${m.id}?print=1`, "_blank")}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Print maintenance request"
                          aria-label="Print maintenance request"
                        >
                          <Printer className="size-3.5" />
                        </button>
                        <Badge className={`text-[10px] ${STATUS_BADGE[m.status]}`}>{STATUS_LABEL[m.status]}</Badge>
                        <Badge
                          variant={m.urgency === "critical" || m.urgency === "high" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {urgencyLabel(m.urgency)}
                        </Badge>
                      </div>
                    </div>
                    <Link to={`/report/maintenance/${m.id}`} className="block">
                      <p className="text-foreground line-clamp-2 mb-1 hover:underline">{m.problemDescription}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{m.equipmentName}</span>
                        <span>{relativeTime(m.submittedAt)}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ReporterLayout>
  );
}
