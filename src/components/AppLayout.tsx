import { NavLink } from "@/components/NavLink";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  ClipboardList,
  CalendarClock,
  BarChart3,
} from "lucide-react";
import { alerts, workOrders } from "@/data/cmms";
import { StatusDot } from "@/components/StatusDot";

const nav = [
  { to: "/", label: "Live Dashboard", icon: LayoutDashboard, end: true },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { to: "/maintenance", label: "PM Schedule", icon: CalendarClock },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  breadcrumb?: string;
}

export function AppLayout({ children, pageTitle, breadcrumb }: AppLayoutProps) {
  const openAlerts = alerts.filter((a) => !a.acknowledged).length;
  const openWO = workOrders.filter((w) => w.status !== "done").length;

  const counts: Record<string, number | undefined> = {
    "/alerts": openAlerts,
    "/work-orders": openWO,
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-panel flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-3 bg-foreground" />
            <span className="font-mono-data tracking-widest font-bold text-sm uppercase">
              Aegis Ops
            </span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
          <div className="text-[10px] font-mono-data text-muted-foreground uppercase tracking-widest px-2 mb-2">
            Telemetry
          </div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-3 px-2 py-2 border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors text-sm font-medium"
              activeClassName="bg-panel-elevated !border-foreground !text-foreground"
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate flex-1">{item.label}</span>
              {counts[item.to] ? (
                <span className="font-mono-data text-[10px] bg-secondary px-1.5 py-0.5">
                  {counts[item.to]}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-8 bg-panel-elevated border border-ring flex items-center justify-center font-mono-data text-xs">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">Operator 04</span>
              <span className="text-[10px] font-mono-data text-muted-foreground">
                AUTH-LVL-3
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 border-b border-border flex items-center justify-between shrink-0 bg-panel">
          <div className="flex items-baseline gap-4 min-w-0">
            <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
            {breadcrumb && (
              <span className="font-mono-data text-muted-foreground text-xs truncate">
                {breadcrumb}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <StatusDot tone={openAlerts > 0 ? "crit" : "ok"} />
              <span className="font-mono-data text-xs text-muted-foreground tracking-wide uppercase">
                {openAlerts > 0 ? `${openAlerts} Active Alerts` : "System Nominal"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-background">{children}</main>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return (
    <span className="font-mono-data text-sm tracking-tight">
      {hh}:{mm}:{ss} UTC
    </span>
  );
}
