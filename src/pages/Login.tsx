import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "@/lib/auth";
import logoRed from "@/assets/kmc-logo-red.svg";
import logoWhite from "@/assets/kmc-logo-white.svg";

const kmcRed = "#C8102E";
const kmcRedHover = "#A30D24";
const kmcRedLight = "rgba(200, 16, 46, 0.12)";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate(from, { replace: true });
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#f8f8f8] lg:bg-white">
      {/* Left side — KMC brand panel (desktop) */}
      <div
        aria-hidden
        className="hidden lg:flex lg:w-3/5 relative"
        style={{
          background: `linear-gradient(135deg, ${kmcRed} 0%, #9B0B20 55%, #6E0716 100%)`,
        }}
      >
        {/* Subtle geometric texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 0%, transparent 25%), radial-gradient(circle at 80% 70%, #fff 0%, transparent 30%), linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.08) 50%, transparent 52%)",
            backgroundSize: "100% 100%, 100% 100%, 60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 pb-16">
          {/* Top brand */}
          <div className="flex items-center gap-4">
            <img
              src={logoWhite}
              alt="KMC"
              width={48}
              height={48}
              className="size-12 object-contain"
            />
            <div className="flex flex-col">
              <span
                className="font-semibold text-white text-xl tracking-tight"
                style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
              >
                Kiira Motors Corporation
              </span>
              <span
                className="text-white/70 text-xs font-mono-data uppercase tracking-widest"
              >
                Industrial Maintenance Systems
              </span>
            </div>
          </div>

          {/* Center value prop */}
          <div className="max-w-lg">
            <h2
              className="text-white text-3xl font-semibold leading-tight mb-4"
              style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
            >
              Factory Heartbeat Monitor
            </h2>
            <p
              className="text-white/75 text-base leading-relaxed"
              style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
            >
              Computerised Maintenance Management System. Monitor factory
              machines, alerts, work orders, and preventive maintenance in real
              time.
            </p>

            <div className="flex items-center gap-8 mt-10">
              <div>
                <div
                  className="text-white text-2xl font-semibold"
                  style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
                >
                  CMMS
                </div>
                <div className="text-white/60 text-xs font-mono-data uppercase tracking-wider">
                  Maintenance Operations
                </div>
              </div>
              <div className="w-px h-10 bg-white/25" />
              <div>
                <div
                  className="text-white text-2xl font-semibold"
                  style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
                >
                  KMC
                </div>
                <div className="text-white/60 text-xs font-mono-data uppercase tracking-wider">
                  Uganda
                </div>
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <p className="text-white/50 text-xs font-mono-data uppercase tracking-widest">
            Drive the future. Maintain the present.
          </p>
        </div>
      </div>

      {/* Mobile branded header */}
      <div
        className="lg:hidden absolute top-0 left-0 right-0 h-48 z-0"
        style={{
          background: `linear-gradient(135deg, ${kmcRed} 0%, #9B0B20 100%)`,
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

      {/* Right side — sign-in form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[420px]">
          {/* Logo visible on mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img
              src={logoWhite}
              alt="KMC"
              width={44}
              height={44}
              className="size-11 object-contain"
            />
            <div className="flex flex-col">
              <span
                className="font-semibold text-white text-lg tracking-tight"
                style={{ fontFamily: "'Geist', Arial, system-ui, sans-serif" }}
              >
                Kiira Motors Corporation
              </span>
              <span className="text-white/70 text-xs font-mono-data uppercase tracking-widest">
                Maintenance Operations
              </span>
            </div>
          </div>

          {/* Form card */}
          <div
            className="rounded-2xl p-6 sm:p-8 shadow-sm border"
            style={{ background: "#fff", borderColor: "#f0f0f0" }}
          >
            {/* Desktop heading */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-center gap-3 mb-5">
                <img
                  src={logoRed}
                  alt="KMC"
                  width={36}
                  height={36}
                  className="size-9 object-contain"
                />
                <span
                  className="font-semibold text-lg tracking-tight"
                  style={{
                    color: "#111",
                    fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  }}
                >
                  KMC CMMS
                </span>
              </div>
              <h1
                className="font-semibold tracking-tight"
                style={{
                  fontSize: "26px",
                  lineHeight: 1.2,
                  letterSpacing: "-0.5px",
                  color: "#111",
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
              >
                Welcome back
              </h1>
              <p
                className="mt-1.5"
                style={{
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "#666",
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
              >
                Sign in to your maintenance operations console
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-semibold"
                  style={{
                    color: "#333",
                    fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  }}
                >
                  User name
                </label>
                <input
                  id="username"
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full outline-none transition-shadow"
                  style={{
                    height: "46px",
                    padding: "0 14px",
                    fontSize: "14px",
                    lineHeight: 1.43,
                    color: "#111",
                    background: "#fff",
                    borderRadius: "10px",
                    border: "1.5px solid #e5e5e5",
                    fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = kmcRed;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${kmcRedLight}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold"
                  style={{
                    color: "#333",
                    fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full outline-none transition-shadow"
                  style={{
                    height: "46px",
                    padding: "0 14px",
                    fontSize: "14px",
                    lineHeight: 1.43,
                    color: "#111",
                    background: "#fff",
                    borderRadius: "10px",
                    border: "1.5px solid #e5e5e5",
                    fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = kmcRed;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${kmcRedLight}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {error && (
                <p
                  className="text-sm font-mono-data"
                  style={{ color: kmcRed }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full cursor-pointer transition-all"
                style={{
                  height: "46px",
                  padding: "0 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: 1.43,
                  color: "#ffffff",
                  background: kmcRed,
                  borderRadius: "10px",
                  border: "none",
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  letterSpacing: "normal",
                  boxShadow: "0 4px 14px rgba(200, 16, 46, 0.28)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = kmcRedHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = kmcRed;
                }}
              >
                Sign In
              </button>
            </form>
          </div>

          <p
            className="text-center mt-8"
            style={{
              fontSize: "12px",
              lineHeight: 1.33,
              color: "#999",
              fontFamily: "'Geist Mono', ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            © Kiira Motors Corporation · CMMS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
