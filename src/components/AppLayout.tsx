import { NavLink } from "@/components/NavLink";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  ClipboardList,
  CalendarClock,
  BarChart3,
  Menu,
} from "lucide-react";
import { alerts, workOrders } from "@/data/cmms";
import { StatusDot } from "@/components/StatusDot";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocation } from "react-router-dom";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const counts: Record<string, number | undefined> = {
    "/alerts": openAlerts,
    "/work-orders": openWO,
  };

  const sidebarContent = (
    <>
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
    </>
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-panel flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-panel border-border flex flex-col"
        >
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 px-4 md:px-8 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-panel">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="text-base md:text-lg font-semibold truncate">
                {pageTitle}
              </h1>
              {breadcrumb && (
                <span className="hidden sm:inline font-mono-data text-muted-foreground text-xs truncate">
                  {breadcrumb}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <StatusDot tone={openAlerts > 0 ? "crit" : "ok"} />
              <span className="hidden sm:inline font-mono-data text-xs text-muted-foreground tracking-wide uppercase">
                {openAlerts > 0 ? `${openAlerts} Active Alerts` : "System Nominal"}
              </span>
            </div>
            <div className="hidden md:block h-4 w-px bg-border" />
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

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
    <span className="font-mono-data text-xs md:text-sm tracking-tight">
      {hh}:{mm}:{ss} <span className="hidden sm:inline">UTC</span>
    </span>
  );
}
