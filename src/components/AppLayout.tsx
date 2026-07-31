import { ReactNode, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { jobRequests } from "@/data/jobRequests";
import { maintenanceRequests } from "@/data/maintenanceRequests";
import { StatusDot } from "@/components/StatusDot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocation, useNavigate } from "react-router-dom";
import logoAsset from "@/assets/kmc-logo.webp.asset.json";
const logo = logoAsset.url;

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
  breadcrumb?: string;
}

export function AppLayout({ children, pageTitle, breadcrumb }: AppLayoutProps) {
  const openJR = jobRequests.filter((r) => r.status !== "converted").length;
  const openMRF = maintenanceRequests.filter((r) => r.status === "submitted").length;
  const totalOpenRequests = openJR + openMRF;
  const hasUrgent = jobRequests.some((r) => r.status !== "converted" && r.priority === "urgent") ||
    maintenanceRequests.some((r) => r.status === "submitted" && (r.urgency === "critical" || r.urgency === "high"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <Sidebar
      logo={logo}
      subtitle="KMC · Fleet CMMS"
      onLogout={() => navigate("/login", { replace: true })}
    />
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* Desktop sidebar — stays visible on sm screens and up */}
      <aside className="hidden sm:flex w-56 md:w-60 shrink-0 border-r border-border bg-panel flex-col">
        {sidebar}
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-panel border-border flex flex-col"
        >
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 px-4 md:px-8 border-b border-border flex items-center justify-between gap-3 shrink-0 bg-panel">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
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
              <StatusDot tone={totalOpenRequests > 0 ? (hasUrgent ? "crit" : "warn") : "ok"} />
              <span className="font-mono-data text-xs text-muted-foreground tracking-wide uppercase">
                {totalOpenRequests > 0 ? `${totalOpenRequests} Open Job Request${totalOpenRequests === 1 ? "" : "s"}` : "All Caught Up"}
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
