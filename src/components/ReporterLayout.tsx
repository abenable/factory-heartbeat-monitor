import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getUser, logout } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import logoRed from "@/assets/kmc-logo-red.svg";

interface ReporterLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

export function ReporterLayout({ children, pageTitle }: ReporterLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getUser() ?? "Operator";
  const worker = getWorker(username);

  const onLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  const nav = [
    { to: "/job-requests/maintenance/new", label: "Maintenance Request", icon: FileText },
    { to: "/report", label: "Quick Request", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/report" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src={logoRed}
              alt="Kiira Motors Corporation"
              className="h-9 w-auto object-contain"
              width={36}
              height={36}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Kiira Motors Corporation
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
                Line Operator Console
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-1">
              {nav.map((item) => {
                const active =
                  location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-panel-elevated hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {worker?.name ?? username}
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
                {worker?.jobTitle ?? "Line Operator"}
              </span>
            </div>

            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {pageTitle}
            </h1>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
