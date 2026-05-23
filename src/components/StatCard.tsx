// HUD-style metric card used across dashboards.
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning";
}

export function StatCard({ label, value, delta, icon: Icon, tone = "default" }: Props) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-surface text-foreground border-border";
  const labelTone = tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <div className={`hud-panel p-5 sm:p-6 ${toneClass}`}>
      <div className="flex justify-between items-start mb-4">
        <span className={`font-mono text-[10px] tracking-widest uppercase font-bold ${labelTone}`}>
          {label}
        </span>
        {Icon && <Icon className="size-4 opacity-60" />}
      </div>
      <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
      {delta && (
        <div className={`font-mono text-[11px] mt-2 tabular-nums ${labelTone}`}>{delta}</div>
      )}
    </div>
  );
}
