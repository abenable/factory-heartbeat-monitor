import { useState, FormEvent, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { login, isAuthed } from "@/lib/auth";
import logoWhite from "@/assets/kmc-logo-white.svg";
import logoRed from "@/assets/kmc-logo-red.svg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateFrom = (location.state as { from?: string } | null)?.from;
  const queryFromRaw = searchParams.get("from");
  const from =
    stateFrom ?? (queryFromRaw ? decodeURIComponent(queryFromRaw) : undefined) ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthed()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (login(username, password)) {
      navigate(from, { replace: true });
    } else {
      setError("Invalid username or password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-background lg:bg-white">
      {/* Left — brand panel */}
      <div
        aria-hidden
        className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-12 pb-16"
        style={{
          background: "linear-gradient(135deg, #C8102E 0%, #9B0B20 55%, #6E0716 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 0%, transparent 25%), radial-gradient(circle at 80% 70%, #fff 0%, transparent 30%), linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.08) 50%, transparent 52%)",
            backgroundSize: "100% 100%, 100% 100%, 60px 60px",
          }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <img
            src={logoWhite}
            alt="KMC"
            width={48}
            height={48}
            className="size-12 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-white text-xl tracking-tight">
              Kiira Motors Corporation
            </span>
            <span className="text-white/70 text-xs font-mono-data uppercase tracking-widest">
              Industrial Maintenance Systems
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-white text-3xl font-semibold leading-tight mb-4">
            Factory Heartbeat Monitor
          </h2>
          <p className="text-white/75 text-base leading-relaxed">
            Computerised Maintenance Management System. Monitor factory machines,
            alerts, work orders, and preventive maintenance in real time.
          </p>

          <div className="flex items-center gap-8 mt-10">
            <div>
              <div className="text-white text-2xl font-semibold">CMMS</div>
              <div className="text-white/60 text-xs font-mono-data uppercase tracking-wider">
                Maintenance Operations
              </div>
            </div>
            <div className="w-px h-10 bg-white/25" />
            <div>
              <div className="text-white text-2xl font-semibold">KMC</div>
              <div className="text-white/60 text-xs font-mono-data uppercase tracking-wider">
                Uganda
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/50 text-xs font-mono-data uppercase tracking-widest">
          Drive the future. Maintain the present.
        </p>
      </div>

      {/* Mobile branded header */}
      <div
        className="lg:hidden absolute top-0 left-0 right-0 h-48 z-0"
        style={{
          background: "linear-gradient(135deg, #C8102E 0%, #9B0B20 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, #fff 0%, transparent 30%)",
          }}
        />
      </div>

      {/* Right — sign-in form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img
              src={logoWhite}
              alt="KMC"
              width={44}
              height={44}
              className="size-11 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-white text-lg tracking-tight">
                Kiira Motors Corporation
              </span>
              <span className="text-white/70 text-xs font-mono-data uppercase tracking-widest">
                Maintenance Operations
              </span>
            </div>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="hidden lg:block pb-4">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={logoRed}
                  alt="KMC"
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                />
                <span className="font-semibold text-lg tracking-tight text-[#111]">
                  KMC CMMS
                </span>
              </div>
              <CardTitle className="text-2xl tracking-tight text-[#111]">
                Welcome back
              </CardTitle>
              <CardDescription>
                Sign in to your maintenance operations console
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="username">User name</Label>
                  <Input
                    id="username"
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="h-11 rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="h-11 rounded-lg"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <Link
              to="/welcome"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to corporate welcome
            </Link>
            <p className="text-[11px] text-muted-foreground font-mono-data">
              © Kiira Motors Corporation · CMMS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
