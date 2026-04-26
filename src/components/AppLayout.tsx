import { NavLink } from "@/components/NavLink";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  ClipboardList,
  CalendarClock,
  Menu,
  Inbox,
  ClipboardCheck,
  LogOut,
  Wrench,
  Package,
  TrendingUp,
} from "lucide-react";
import { alerts, workOrders, getBacklog } from "@/data/cmms";
import { StatusDot } from "@/components/StatusDot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { getUser, logout } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/", label: "Live Dashboard", icon: LayoutDashboard, end: true },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { to: "/rca", label: "Root Cause Analysis", icon: ClipboardCheck },
  { to: "/backlog", label: "Backlog", icon: Inbox },
  { to: "/maintenance", label: "PM Schedule", icon: CalendarClock },
  { to: "/material-control", label: "Material Control", icon: Package },
  { to: "/craftsmen-management", label: "Craftsmen Management", icon: Wrench },
  { to: "/performance-reports", label: "Performance Reports", icon: TrendingUp },
];

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  breadcrumb?: string;
}

export function AppLayout({ children, pageTitle, breadcrumb }: AppLayoutProps) {
  const openAlerts = alerts.filter((a) => !a.acknowledged).length;
  const openWO = workOrders.filter((w) => w.status !== "done").length;
  const backlogCount = getBacklog().length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser() ?? "Operator";
  const worker = getWorker(getUser());

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const counts: Record<string, number | undefined> = {
    "/alerts": openAlerts,
    "/work-orders": openWO,
    "/backlog": backlogCount,
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const sidebarContent = (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <img src={logo} alt="Alpha Industry Limited" width={32} height={32} className="size-8 shrink-0 object-contain" loading="lazy" />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm leading-tight truncate">
            Alpha Industry Limited
          </span>
          <span className="font-mono-data text-[9px] tracking-widest text-muted-foreground uppercase">
            Limited · CMMS
          </span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-1">
        <div className="text-[10px] font-mono-data text-primary uppercase tracking-widest px-2 mb-2">
          Telemetry
        </div>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex items-center gap-3 px-2 py-2 border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors text-sm font-medium"
            activeClassName="bg-panel-elevated !border-primary !text-primary"
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
        <Link
          to="/profile"
          className="flex items-center gap-3 px-2 py-2 hover:bg-panel-elevated transition-colors"
          title="View profile"
        >
          <div className="size-9 bg-primary/10 border border-primary/30 text-primary flex items-center justify-center font-mono-data text-xs font-bold shrink-0">
            {user.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-medium truncate">
              {worker?.name ?? user}
            </span>
            <span className="text-[10px] font-mono-data text-muted-foreground truncate uppercase">
              {worker?.jobTitle ?? "Technician"}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </Link>
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
              <h1 className="text-base md:text-lg font-semibold truncate text-primary">
                {pageTitle}
              </h1>
              {breadcrumb && (
                <span className="hidden sm:inline font-mono-data text-primary text-xs truncate">
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
            <ThemeToggle />
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
  const date = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = now.toLocaleTimeString(undefined, { hour12: false });
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="font-mono-data text-xs md:text-sm tracking-tight">
        {time}
      </span>
      <span className="hidden sm:inline font-mono-data text-[10px] text-muted-foreground uppercase tracking-widest">
        {date}
      </span>
    </div>
  );
}
