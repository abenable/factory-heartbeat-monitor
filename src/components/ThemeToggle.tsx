import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-md",
        "text-muted-foreground hover:text-foreground hover:bg-panel-elevated transition-colors",
        className,
      )}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="hidden sm:inline font-mono-data text-[10px] uppercase tracking-widest">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
