import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "@/lib/auth";
import logo from "@/assets/kmc-logo.webp.asset.json";
import loginBg from "@/assets/login-bg.jpeg";

const focusRing = "#27ae9c";

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
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Left side — sharp industrial background image */}
      <div
        aria-hidden
        className="hidden lg:flex lg:w-3/5 relative"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(2,12,30,0.55) 0%, rgba(2,12,30,0.70) 100%)",
          }}
        />
        {/* Left-side content — branding */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={logo}
              alt="Kiira Motors Corporation"
              width={40}
              height={40}
              className="size-10 object-contain"
            />
            <div className="flex flex-col">
              <span
                className="font-semibold text-white text-lg tracking-tight"
                style={{
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                  textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                Kiira Motors Corporation
              </span>
              <span
                className="text-white/60 text-xs font-mono-data uppercase tracking-widest"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}
              >
                Industrial Maintenance Systems
              </span>
            </div>
          </div>
          <p
            className="text-white/50 text-sm font-mono-data max-w-md leading-relaxed"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          >
            Computerised Maintenance Management System.
            Monitor factory machines, alerts, work orders, and
            preventive maintenance in real time.
          </p>
        </div>
      </div>

      {/* Mobile top image (shows on small screens) */}
      <div
        aria-hidden
        className="lg:hidden absolute inset-0"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.5)",
        }}
      />
      <div className="lg:hidden absolute inset-0 bg-white/90 backdrop-blur-sm" />

      {/* Right side — solid white sign-in form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-12 bg-background lg:bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo visible on mobile */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img
              src={logo}
              alt="Kiira Motors Corporation"
              width={36}
              height={36}
              className="size-9 object-contain"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight">
                Kiira Motors Corporation
              </span>
              <span className="text-muted-foreground text-xs font-mono-data uppercase tracking-widest">
                Maintenance Operations
              </span>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1
              className="font-semibold tracking-tight"
              style={{
                fontSize: "28px",
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

          {/* Sign-in card */}
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
                  height: "44px",
                  padding: "0 14px",
                  fontSize: "14px",
                  lineHeight: 1.43,
                  color: "#111",
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1.5px solid #e5e5e5",
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = focusRing;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(39,174,156,0.15)`;
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
                  height: "44px",
                  padding: "0 14px",
                  fontSize: "14px",
                  lineHeight: 1.43,
                  color: "#111",
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1.5px solid #e5e5e5",
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = focusRing;
                  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(39,174,156,0.15)`;
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
                style={{ color: "#e74c3c" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full cursor-pointer transition-all"
              style={{
                height: "44px",
                padding: "0 16px",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1.43,
                color: "#ffffff",
                background: "#27ae9c",
                borderRadius: "8px",
                border: "none",
                fontFamily: "'Geist', Arial, system-ui, sans-serif",
                letterSpacing: "normal",
                boxShadow: "0 4px 14px rgba(39,174,156,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#219a8a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#27ae9c";
              }}
            >
              Sign In
            </button>
          </form>

          <p
            className="text-center mt-10"
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
