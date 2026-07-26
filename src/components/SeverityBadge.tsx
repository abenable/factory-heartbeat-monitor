import { StatusDot } from "@/components/StatusDot";

export function SeverityBadge({ severity }: { severity: "crit" | "warn" | "info" }) {
  const map = {
    crit: { label: "Critical", tone: "crit" as const },
    warn: { label: "Warning", tone: "warn" as const },
    info: { label: "INFO", tone: "info" as const },
  };
  const s = map[severity];
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot tone={s.tone} pulse={s.tone === "crit"} />
      <span
        className={`font-bold ${
          s.tone === "crit"
            ? "text-led-crit"
            : s.tone === "warn"
            ? "text-led-warn"
            : "text-led-info"
        }`}
      >
        {s.label}
      </span>
    </span>
  );
}

export function formatTs(iso: string) {
  const d = new Date(iso);
  const date = d.toISOString().slice(5, 10).replace("-", "/");
  const time = d.toISOString().slice(11, 19);
  return `${date} ${time}`;
}
