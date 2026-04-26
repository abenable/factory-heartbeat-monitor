import { useState, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "@/lib/auth";
import logo from "@/assets/logo.png";
import loginBg from "@/assets/login-bg.jpeg";

const borderShadow = "rgba(0,0,0,0.08) 0px 0px 0px 1px";
const subtleShadow = "rgba(0,0,0,0.25) 0px 10px 40px -10px, rgba(0,0,0,0.15) 0px 4px 12px";
const focusRing = "hsla(212, 100%, 48%, 1)";

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        fontFamily: "'Geist', Arial, system-ui, sans-serif",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(5,15,30,0.72), rgba(5,15,30,0.55))" }}
      />
      <div className="w-full max-w-[420px] flex flex-col items-center gap-10 relative z-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-5">
          <div className="size-20 flex items-center justify-center">
            <img
              src={logo}
              alt="Group 6 Industries Limited"
              width={80}
              height={80}
              className="size-full object-contain"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))" }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1
              className="font-semibold text-center"
              style={{
                fontSize: "32px",
                lineHeight: 1.2,
                letterSpacing: "-1.28px",
                color: "#ffffff",
                fontFamily: "'Geist', Arial, system-ui, sans-serif",
                textShadow: "0 2px 12px rgba(0,0,0,0.5)",
              }}
            >
              Sign In
            </h1>
            <p
              className="text-center"
              style={{
                fontSize: "16px",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.85)",
                fontFamily: "'Geist', Arial, system-ui, sans-serif",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              Group 6 Industries — Maintenance Operations Console
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full flex flex-col gap-6"
          style={{
            background: "#ffffff",
            borderRadius: "8px",
            boxShadow: subtleShadow,
            padding: "32px",
          }}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: 1.43,
                  color: "#171717",
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
                  height: "40px",
                  padding: "0 12px",
                  fontSize: "14px",
                  lineHeight: 1.43,
                  color: "#171717",
                  background: "#ffffff",
                  borderRadius: "6px",
                  boxShadow: borderShadow,
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${focusRing}, ${borderShadow}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = borderShadow;
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: 1.43,
                  color: "#171717",
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
                  height: "40px",
                  padding: "0 12px",
                  fontSize: "14px",
                  lineHeight: 1.43,
                  color: "#171717",
                  background: "#ffffff",
                  borderRadius: "6px",
                  boxShadow: borderShadow,
                  fontFamily: "'Geist', Arial, system-ui, sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${focusRing}, ${borderShadow}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = borderShadow;
                }}
              />
            </div>

            {error && (
              <p
                className="text-sm"
                style={{
                  color: "#ff5b4f",
                  fontFamily: "'Geist Mono', ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full cursor-pointer transition-colors"
              style={{
                height: "40px",
                padding: "0 16px",
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1.43,
                color: "#ffffff",
                background: "#171717",
                borderRadius: "6px",
                border: "none",
                fontFamily: "'Geist', Arial, system-ui, sans-serif",
                letterSpacing: "normal",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#171717";
              }}
            >
              Sign In
            </button>
          </form>
        </div>

        <p
          className="text-center"
          style={{
            fontSize: "12px",
            lineHeight: 1.33,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "'Geist', Arial, system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0,0,0,0.5)",
          }}
        >
          Group 6 Industries Limited · CMMS
        </p>
      </div>
    </div>
  );
};

export default Login;
