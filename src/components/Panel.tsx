import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div className={cn("bg-panel border border-border overflow-hidden rounded-2xl", className)}>
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
      <h2 className="font-mono-data text-xs text-cyan uppercase tracking-widest">
        {children}
      </h2>
      {right}
    </div>
  );
}
