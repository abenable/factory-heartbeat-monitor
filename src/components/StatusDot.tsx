import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "crit" | "info";

interface StatusDotProps {
  tone: Tone;
  pulse?: boolean;
  className?: string;
}

const dotMap: Record<Tone, string> = {
  ok: "bg-led-ok",
  warn: "bg-led-warn",
  crit: "bg-led-crit",
  info: "bg-led-info",
};

export function StatusDot({ tone, pulse, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block size-2.5 rounded-full shrink-0",
        dotMap[tone],
        pulse && "animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}
