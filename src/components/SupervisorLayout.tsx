import { ReactNode, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { jobRequests } from "@/data/jobRequests";
import { StatusDot } from "@/components/StatusDot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocation, useNavigate } from "react-router-dom";
import logoRed from "@/assets/kmc-logo-red.svg";

interface SupervisorLayoutProps {
  children: ReactNode;
}

export function SupervisorLayout({ children }: SupervisorLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const openJR = jobRequests.filter((r) => r.status !== "converted").length;
  const hasUrgent = jobRequests.some((r) => r.status !== "converted" && r.priority === "urgent");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <Sidebar
      logo={logoRed}
      subtitle={
        <span className="flex items-center gap-1">
          Supervisor View
        </span>
      }
      onLogout={() => navigate("/welcome", { replace: true })}
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
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="sm:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              <StatusDot tone={openJR > 0 ? (hasUrgent ? "crit" : "warn") : "ok"} />
              <span className="font-mono-data text-xs text-muted-foreground tracking-wide uppercase">
                {openJR > 0 ? `${openJR} Open Job Request${openJR === 1 ? "" : "s"}` : "All Caught Up"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <LiveClock />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
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
