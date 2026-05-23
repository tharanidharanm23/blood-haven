import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, AlertTriangle, X } from "lucide-react";
import { BLOOD_GROUPS, type BloodGroup, type InventoryItem } from "@/lib/mock-data";
import { BloodTag } from "@/components/UrgencyBadge";
import { addInventoryUnits, getInventoryData } from "@/lib/client-api";

export const Route = createFileRoute("/_app/inventory")({
  head: () => ({
    meta: [
      { title: "Blood Inventory — Donor Land" },
      { name: "description", content: "Track blood unit inventory, capacity, and expiry." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getInventoryData()
      .then((data) => {
        if (!active) return;
        setItems(data.inventory);
      })
      .catch(() => toast.error("Could not load inventory"));
    return () => {
      active = false;
    };
  }, []);

  const addUnits = async (group: BloodGroup, units: number, expiry: string) => {
    const result = await addInventoryUnits({ data: { bloodGroup: group, units, expiry } });
    setItems(result.inventory);
    toast.success(`+${units} units of ${group} added`);
  };

  const total = items.reduce((s, i) => s + i.units, 0);
  const low = items.filter((i) => i.units / i.capacity < 0.25).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Cold Storage</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Blood Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString()} units across {items.length} types · {low} low-stock alert{low === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground transition-colors"
        >
          <Plus className="size-3.5" /> Add Units
        </button>
      </header>

      <div className="hud-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              <th className="text-left p-4">Blood Group</th>
              <th className="text-left p-4">Units Available</th>
              <th className="text-left p-4 hidden md:table-cell">Capacity</th>
              <th className="text-left p-4 hidden md:table-cell">Expiry</th>
              <th className="text-right p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const ratio = item.units / item.capacity;
              const low = ratio < 0.25;
              const warn = ratio >= 0.25 && ratio < 0.5;
              return (
                <tr key={item.bloodGroup} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="p-4"><BloodTag group={item.bloodGroup} /></td>
                  <td className="p-4">
                    <div className="font-mono text-lg font-bold tabular-nums">{item.units}</div>
                    <div className="w-32 h-1.5 bg-muted mt-1.5 overflow-hidden">
                      <div
                        className={`h-full ${low ? "bg-primary" : warn ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell font-mono text-muted-foreground tabular-nums">{item.capacity}</td>
                  <td className="p-4 hidden md:table-cell font-mono text-muted-foreground">{item.expiry}</td>
                  <td className="p-4 text-right">
                    {low ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase font-bold text-primary border border-primary/30 bg-primary/10 px-2 py-1">
                        <AlertTriangle className="size-3" /> Low
                      </span>
                    ) : warn ? (
                      <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-warning border border-warning/30 bg-warning/10 px-2 py-1">
                        Watch
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] tracking-widest uppercase text-success">● Nominal</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && <AddModal onClose={() => setOpen(false)} onAdd={addUnits} />}
    </div>
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (g: BloodGroup, u: number, exp: string) => Promise<void> }) {
  const [group, setGroup] = useState<BloodGroup>("O+");
  const [units, setUnits] = useState(5);
  const [expiry, setExpiry] = useState("2026-06-30");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 animate-fade-in" onClick={onClose}>
      <div
        className="bg-surface border border-border w-full max-w-md hud-shadow animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex justify-between items-center">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-primary">// Intake</div>
            <h2 className="text-lg font-bold">Add Blood Units</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <label>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Blood Group</div>
            <select value={group} onChange={(e) => setGroup(e.target.value as BloodGroup)} className="w-full px-3 py-2.5 bg-background border border-border font-mono text-sm focus:border-primary outline-none">
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Units</div>
            <input type="number" min={1} value={units} onChange={(e) => setUnits(Number(e.target.value))} className="w-full px-3 py-2.5 bg-background border border-border font-mono text-sm focus:border-primary outline-none" />
          </label>
          <label>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">Expiry</div>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-3 py-2.5 bg-background border border-border font-mono text-sm focus:border-primary outline-none" />
          </label>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-border font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted">Cancel</button>
          <button
            onClick={async () => { await onAdd(group, units, expiry); onClose(); }}
            className="px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground"
          >
            Confirm Intake
          </button>
        </div>
      </div>
    </div>
  );
}
