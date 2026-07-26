import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Filter, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Panel, SectionHeading } from "@/components/Panel";
import { Badge } from "@/components/ui/badge";
import { jobRequests, JobRequestStatus } from "@/data/jobRequests";

const STATUS_LABEL: Record<JobRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  converted: "Converted",
};

const STATUS_BADGE: Record<JobRequestStatus, string> = {
  new: "bg-foreground text-background",
  assigned: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  converted: "border border-border text-muted-foreground",
};

const filterOptions: { key: "all" | JobRequestStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "converted", label: "Converted" },
];

export default function JobRequests() {
  const [filter, setFilter] = useState<"all" | JobRequestStatus>("all");

  const list = useMemo(
    () => (filter === "all" ? jobRequests : jobRequests.filter((r) => r.status === filter)),
    [filter],
  );

  return (
    <AppLayout pageTitle="Job Requests" breadcrumb="INCOMING REQUESTS">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Inbox className="size-5 text-primary" />
            <span className="font-mono-data text-xs text-muted-foreground uppercase tracking-widest">
              {jobRequests.filter((r) => r.status !== "converted").length} open
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            {filterOptions.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 font-mono-data text-[10px] uppercase tracking-widest border rounded-full transition-colors ${
                  filter === f.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <SectionHeading>{list.length} Request{list.length === 1 ? "" : "s"}</SectionHeading>

        <Panel className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-panel-elevated font-mono-data text-[10px] text-primary uppercase">
                <th className="p-3 w-28">ID</th>
                <th className="p-3 w-28">Status</th>
                <th className="p-3">Description</th>
                <th className="p-3 w-32">Equipment</th>
                <th className="p-3 w-36">Requester</th>
                <th className="p-3 w-28">Age</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {list.map((jr) => (
                <tr
                  key={jr.id}
                  className="border-b border-border last:border-b-0 hover:bg-panel-elevated transition-colors"
                >
                  <td className="p-3">
                    <Link
                      to={`/job-requests/${jr.id}`}
                      className="font-mono-data text-xs font-bold text-primary hover:underline"
                    >
                      {jr.id}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Badge className={`text-[10px] ${STATUS_BADGE[jr.status]}`}>
                      {STATUS_LABEL[jr.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/job-requests/${jr.id}`}
                      className="block hover:underline font-medium line-clamp-1"
                    >
                      {jr.description}
                    </Link>
                  </td>
                  <td className="p-3 font-mono-data text-xs text-muted-foreground">
                    <Link to={`/machines/${jr.equipmentId}`} className="hover:text-primary">
                      {jr.equipmentId}
                    </Link>
                  </td>
                  <td className="p-3 text-muted-foreground">{jr.requester}</td>
                  <td className="p-3 text-muted-foreground text-xs">{relativeTime(jr.requestedAt)}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No job requests match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppLayout>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}
