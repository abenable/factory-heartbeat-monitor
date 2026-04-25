import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import { Printer, BadgeCheck, Mail, Phone, CalendarDays, Clock, Building2, IdCard, Award } from "lucide-react";
import logo from "@/assets/logo.png";

const Field = ({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="flex flex-col gap-1 py-3 border-b border-border last:border-b-0">
    <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="size-3" />}
      {label}
    </span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const username = getUser();
  const worker = getWorker(username);

  if (!worker) {
    return (
      <AppLayout pageTitle="Worker Profile">
        <Panel className="p-6">
          <p className="text-sm text-muted-foreground">No profile found for this user.</p>
        </Panel>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Worker Profile" breadcrumb={`/ ${worker.workerId}`}>
      <div className="flex flex-col gap-4 max-w-4xl">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">
            Account summary &amp; credentials.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4 mr-2" /> Print ID Card
          </Button>
        </div>

        {/* Header card */}
        <Panel className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="size-24 sm:size-28 shrink-0 bg-panel-elevated border border-border flex items-center justify-center overflow-hidden">
            <img src={logo} alt="Group 6 Industries" width={112} height={112} loading="lazy" className="size-full object-contain p-2" />
          </div>
          <div className="flex-1 flex flex-col gap-1.5 text-center sm:text-left">
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground">
              Group 6 Industries Limited
            </span>
            <h2 className="text-2xl font-bold leading-tight">{worker.name}</h2>
            <p className="text-sm text-primary font-medium">{worker.jobTitle}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
              <span className="font-mono-data text-[10px] uppercase tracking-widest bg-panel-elevated border border-border px-2 py-0.5">
                {worker.workerId}
              </span>
              <span className="font-mono-data text-[10px] uppercase tracking-widest bg-panel-elevated border border-border px-2 py-0.5">
                {worker.department}
              </span>
            </div>
          </div>
        </Panel>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Panel className="p-5">
            <h3 className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Identification
            </h3>
            <Field icon={IdCard} label="Worker ID" value={worker.workerId} />
            <Field icon={Building2} label="Department" value={worker.department} />
            <Field icon={CalendarDays} label="Joined" value={worker.joined} />
            <Field icon={Clock} label="Shift" value={worker.shift} />
          </Panel>

          <Panel className="p-5">
            <h3 className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Working Licence
            </h3>
            <Field icon={BadgeCheck} label="Licence" value={worker.license} />
            <Field icon={CalendarDays} label="Expires" value={worker.licenseExpiry} />
            <Field icon={Mail} label="Email" value={worker.email} />
            <Field icon={Phone} label="Phone" value={worker.phone} />
          </Panel>

          <Panel className="p-5 md:col-span-2">
            <h3 className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="size-3" /> Certifications
            </h3>
            <div className="flex flex-wrap gap-2">
              {worker.certifications.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 bg-panel-elevated border border-border font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </Panel>
        </div>

        <div className="print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
