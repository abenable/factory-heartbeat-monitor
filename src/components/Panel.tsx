import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  topAccent?: "default" | "crit" | "warn" | "ok" | "none";
}

const accentMap = {
  default: "bg-border",
  crit: "bg-led-crit led-glow-crit",
  warn: "bg-led-warn led-glow-warn",
  ok: "bg-led-ok led-glow-ok",
  none: "hidden",
};

export function Panel({ children, className, topAccent = "default" }: PanelProps) {
  return (
    <div className={cn("relative bg-panel border border-border overflow-hidden rounded-2xl", className)}>
      <div className={cn("absolute top-0 left-0 w-full h-px", accentMap[topAccent])} />
      {children}
    </div>
  );
}

interface SectionHeadingProps {
  children: ReactNode;
  right?: ReactNode;
}

export function SectionHeading({ children, right }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between border-b border-border pb-2 mb-4">
      <h2 className="font-mono-data text-xs text-muted-foreground uppercase tracking-widest">
        {children}
      </h2>
      {right}
    </div>
  );
}
