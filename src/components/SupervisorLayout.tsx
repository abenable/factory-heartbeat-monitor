import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, logout } from "@/lib/auth";
import { getWorker } from "@/data/workers";
import logoRed from "@/assets/kmc-logo-red.svg";

interface SupervisorLayoutProps {
  children: ReactNode;
}

export function SupervisorLayout({ children }: SupervisorLayoutProps) {
  const navigate = useNavigate();
  const username = getUser() ?? "Supervisor";
  const worker = getWorker(username);

  const onLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src={logoRed}
              alt="Kiira Motors Corporation"
              className="h-9 w-auto object-contain"
              width={36}
              height={36}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#171717]">
                Kiira Motors Corporation
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Shield className="size-3 text-primary" /> Supervisor View
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium truncate max-w-[180px]">
                {worker?.name ?? username}
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
                {worker?.jobTitle ?? "Supervisor"}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
