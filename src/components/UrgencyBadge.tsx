import type { Urgency } from "@/lib/mock-data";

export function UrgencyBadge({ level }: { level: Urgency }) {
  const map: Record<Urgency, string> = {
    Normal: "bg-muted text-muted-foreground border-border",
    Urgent: "bg-warning/15 text-warning border-warning/30",
    Critical: "bg-primary/10 text-primary border-primary/30",
  };
  return (
    <span
      className={`font-mono text-[10px] tracking-widest uppercase font-bold px-2 py-1 border ${map[level]}`}
    >
      {level === "Critical" && "● "}
      {level}
    </span>
  );
}

export function BloodTag({ group }: { group: string }) {
  return (
    <span className="font-mono text-xs font-bold px-2 py-1 bg-primary/10 text-primary border border-primary/20 tabular-nums">
      {group}
    </span>
  );
}
