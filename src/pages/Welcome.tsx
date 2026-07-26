import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Cpu,
  Package,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAuthed } from "@/lib/auth";
import { alerts, machines, workOrders } from "@/data/cmms";
import logoRed from "@/assets/kmc-logo-red.svg";

const running = machines.filter((m) => m.status === "running").length;
const fleetUptime =
  machines.reduce((sum, m) => sum + m.uptime, 0) / (machines.length || 1);
const openWO = workOrders.filter((w) => w.status !== "done").length;
const critical = alerts.filter(
  (a) => a.severity === "crit" && !a.acknowledged,
).length;

const stats = [
  { value: `${running}`, label: "Machines online" },
  { value: `${fleetUptime.toFixed(1)}%`, label: "Fleet uptime (30d)" },
  { value: `${openWO}`, label: "Open work orders" },
  { value: `${critical}`, label: "Critical alerts" },
];

const features = [
  {
    icon: Activity,
    title: "Real-time monitoring",
    description:
      "Live telemetry, status LEDs and anomaly detection for every machine node on the factory floor.",
  },
  {
    icon: AlertTriangle,
    title: "Alerts & escalation",
    description:
      "Instant critical, warning and info alerts with acknowledgement trails and root cause analysis.",
  },
  {
    icon: ClipboardList,
    title: "Work order control",
    description:
      "Create, assign and track corrective and preventive work orders from open to done.",
  },
  {
    icon: CalendarClock,
    title: "Preventive maintenance",
    description:
      "PM schedules, service due dates and automatic reminders to keep uptime high.",
  },
  {
    icon: Package,
    title: "Material control",
    description:
      "Spare parts inventory, BOM links and stock-level checks tied directly to work orders.",
  },
  {
    icon: BarChart3,
    title: "Performance reports",
    description:
      "Uptime, backlog, craftsmen utilisation and downtime analytics for data-driven decisions.",
  },
];

const Welcome = () => {
  const authed = isAuthed();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("from")
    ? decodeURIComponent(searchParams.get("from")!)
    : undefined;
  const signInLink = authed
    ? { to: "/" as const }
    : { to: "/login" as const, state: returnTo ? { from: returnTo } : undefined };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/welcome"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <img
              src={logoRed}
              alt="Kiira Motors Corporation"
              className="h-9 w-auto object-contain"
              width={36}
              height={36}
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Kiira Motors Corporation
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
                Fleet CMMS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#stats" className="hover:text-foreground transition-colors">
              Impact
            </a>
            <a href="#contact" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to={signInLink.to} state={signInLink.state}>
              <Button className="rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                {authed ? "Open Dashboard" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.06] via-background to-background" />
          <div className="absolute -right-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-primary/[0.04] blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-mono-data uppercase tracking-widest text-secondary-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Industrial Maintenance Systems
              </div>

              <h1
                className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
                style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}
              >
                Drive the future.
                <br />
                Maintain the present.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                The official Computerised Maintenance Management System for Kiira
                Motors Corporation. Monitor factory machines, alerts, work orders,
                preventive maintenance and workforce planning in real time.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to={signInLink.to} state={signInLink.state}>
                  <Button
                    size="lg"
                    className="rounded-md bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                  >
                    {authed ? "Go to Dashboard" : "Sign In to CMMS"}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="rounded-md px-8">
                    Explore Features
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="border-y border-border bg-panel">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-mono-data text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    {s.value}
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-2xl">
              <h2
                className="text-3xl font-semibold tracking-tight text-foreground"
                style={{ letterSpacing: "-0.03em" }}
              >
                Everything your maintenance team needs
              </h2>
              <p className="mt-3 text-muted-foreground">
                One integrated platform for the entire KMC maintenance lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className="border-border/60 p-6 transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2
              className="text-3xl font-semibold tracking-tight text-foreground"
              style={{ letterSpacing: "-0.03em" }}
            >
              Ready to keep the fleet running?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Access the maintenance operations console to track machines, manage
              work orders and prevent downtime.
            </p>
            <div className="mt-8">
              <Link to={signInLink.to} state={signInLink.state}>
                <Button
                  size="lg"
                  className="rounded-md bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                >
                  {authed ? "Open CMMS Dashboard" : "Sign In to CMMS"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        id="contact"
        className="border-t border-border bg-panel py-10"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:px-6 md:flex-row md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={logoRed}
              alt="KMC"
              className="h-8 w-auto object-contain"
              width={32}
              height={32}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                Kiira Motors Corporation
              </span>
              <span className="text-[10px] font-mono-data uppercase tracking-widest text-muted-foreground">
                Jinja, Uganda
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground font-mono-data">
            © {new Date().getFullYear()} Kiira Motors Corporation · Fleet CMMS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
