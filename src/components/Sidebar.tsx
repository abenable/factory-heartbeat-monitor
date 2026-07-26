import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Inbox,
  ClipboardList,
  CalendarClock,
  ClipboardCheck,
  LogOut,
  Wrench,
  Package,
  TrendingUp,
  History,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { workOrders, getBacklog } from "@/data/cmms";
import { jobRequests } from "@/data/jobRequests";
import { getUser, logout } from "@/lib/auth";
import { getWorker } from "@/data/workers";

const nav = [
  { to: "/", label: "Live Dashboard", icon: LayoutDashboard, end: true },
  { to: "/machines", label: "Machines", icon: Cpu },
  { to: "/job-requests", label: "Job Requests", icon: Inbox },
  { to: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { to: "/rca", label: "Root Cause Analysis", icon: ClipboardCheck },
  { to: "/backlog", label: "Backlog", icon: History },
  { to: "/maintenance", label: "PM Schedule", icon: CalendarClock },
  { to: "/material-control", label: "Material Control", icon: Package },
  { to: "/craftsmen-management", label: "Craftsmen Management", icon: Wrench },
  { to: "/performance-reports", label: "Performance Reports", icon: TrendingUp },
];

interface SidebarProps {
  logo: string;
  subtitle: ReactNode;
  onLogout?: () => void;
}

export function Sidebar({ logo, subtitle, onLogout }: SidebarProps) {
  const openJR = jobRequests.filter((r) => r.status !== "converted").length;
  const openWO = workOrders.filter((w) => w.status !== "done").length;
  const backlogCount = getBacklog().length;

  const counts: Record<string, number | undefined> = {
    "/job-requests": openJR,
    "/work-orders": openWO,
    "/backlog": backlogCount,
  };

  const user = getUser() ?? "Operator";
  const worker = getWorker(getUser());

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    onLogout?.();
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <img
          src={logo}
          alt="Kiira Motors Corporation"
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
          loading="lazy"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm leading-tight truncate">
            Kiira Motors Corporation
          </span>
          <span className="font-mono-data text-[9px] tracking-widest text-muted-foreground uppercase">
            {subtitle}
          </span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] font-mono-data text-primary uppercase tracking-widest px-2 mb-2">
          Modules
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
            onClick={handleLogout}
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
}
