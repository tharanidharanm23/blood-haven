import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Phone, MessageCircle, ArrowRight, Send } from "lucide-react";
import { BloodTag } from "@/components/UrgencyBadge";
import { getHospitalChainData, transferBloodBetweenHospitals } from "@/lib/client-api";
import { getSessionUser } from "@/lib/session";
import type { BloodGroup, InventoryItem } from "@/lib/mock-data";
import { BLOOD_GROUPS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/hospital-chain")({
  head: () => ({
    meta: [
      { title: "Hospital Chain — Donor Land" },
      { name: "description", content: "Transfer blood units between hospitals in the network." },
    ],
  }),
  component: HospitalChainPage,
});

type HospitalEntry = {
  name: string;
  phone?: string;
  email?: string;
  district: string;
  constituency?: string;
  address?: string;
  verified?: boolean;
};

function HospitalChainPage() {
  const session = getSessionUser();
  const district = session?.district;
  const constituency = session?.constituency;
  const email = session?.email;
  const [hospitals, setHospitals] = useState<HospitalEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferTarget, setTransferTarget] = useState<HospitalEntry | null>(null);
  const [transferForm, setTransferForm] = useState({ bloodGroup: "O+" as BloodGroup, units: 1 });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (!district) {
      setLoading(false);
      return;
    }
    getHospitalChainData({
      data: {
        district,
        constituency,
        email,
      },
    })
      .then((res) => {
        setHospitals(res.hospitals);
        setInventory(res.inventory);
      })
      .catch(() => toast.error("Could not load hospital chain"))
      .finally(() => setLoading(false));
  }, [district, constituency, email]);

  const whatsappLink = (phone: string | undefined, text: string) => {
    if (!phone) return undefined;
    const digits = phone.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;
  };

  const handleTransfer = async () => {
    if (!transferTarget || !session?.email) return;
    setTransferring(true);
    try {
      const res = await transferBloodBetweenHospitals({
        data: {
          fromHospitalEmail: session.email,
          toHospitalName: transferTarget.name,
          toHospitalEmail: transferTarget.email,
          bloodGroup: transferForm.bloodGroup,
          units: transferForm.units,
        },
      });
      setInventory(res.inventory);
      toast.success(
        `Transferred ${transferForm.units}U of ${transferForm.bloodGroup} to ${transferTarget.name}`,
      );
      setTransferTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">
          // Network
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Hospital Chain</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer blood units to nearby hospitals or request from them.
        </p>
      </header>

      {/* Current inventory summary */}
      <div className="hud-panel">
        <div className="p-4 border-b border-border">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Your Inventory
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-px bg-border">
          {inventory.map((item) => (
            <div key={item.bloodGroup} className="bg-surface p-3 text-center">
              <BloodTag group={item.bloodGroup} />
              <div className="font-mono text-lg font-bold mt-1">{item.units}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="hud-panel p-12 text-center text-muted-foreground font-mono text-sm">
          Loading hospital network...
        </div>
      ) : hospitals.length === 0 ? (
        <div className="hud-panel p-12 text-center">
          <Link2 className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No other hospitals found in the network.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {hospitals.map((h) => (
            <div key={h.email ?? h.name} className="bg-surface p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{h.name}</h3>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {h.district} · {h.constituency}
                  </div>
                  {h.address && (
                    <div className="text-xs text-muted-foreground mt-1">{h.address}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {h.verified && (
                    <span className="font-mono text-[9px] tracking-widest uppercase text-success border border-success/30 bg-success/10 px-1.5 py-0.5">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <a
                  href={h.phone ? `tel:${h.phone}` : undefined}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                  onClick={(e) => {
                    if (!h.phone) {
                      e.preventDefault();
                      toast.error("No phone");
                    }
                  }}
                >
                  <Phone className="size-3" /> Call
                </a>
                <a
                  href={whatsappLink(
                    h.phone,
                    `Hi ${h.name}, this is ${session?.name ?? "Hospital"}. We'd like to coordinate blood supply.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                  onClick={(e) => {
                    if (!h.phone) {
                      e.preventDefault();
                      toast.error("No phone");
                    }
                  }}
                >
                  <MessageCircle className="size-3" /> Chat
                </a>
                <button
                  onClick={() => setTransferTarget(h)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground transition-colors"
                >
                  <Send className="size-3" /> Give
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer modal */}
      {transferTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 animate-fade-in"
          onClick={() => setTransferTarget(null)}
        >
          <div
            className="bg-surface border border-border w-full max-w-md hud-shadow animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border">
              <div className="font-mono text-[10px] tracking-widest uppercase text-primary">
                // Blood Transfer
              </div>
              <h2 className="text-lg font-bold">Give to {transferTarget.name}</h2>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{session?.name}</span>
                <ArrowRight className="size-4" />
                <span className="font-bold text-foreground">{transferTarget.name}</span>
              </div>
              <label>
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Blood Group
                </div>
                <select
                  value={transferForm.bloodGroup}
                  onChange={(e) =>
                    setTransferForm((p) => ({ ...p, bloodGroup: e.target.value as BloodGroup }))
                  }
                  className="w-full px-3 py-2.5 bg-background border border-border font-mono text-sm focus:border-primary outline-none"
                >
                  {BLOOD_GROUPS.map((g) => {
                    const stock = inventory.find((i) => i.bloodGroup === g);
                    return (
                      <option key={g} value={g}>
                        {g} ({stock?.units ?? 0} available)
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Units
                </div>
                <input
                  type="number"
                  min={1}
                  max={inventory.find((i) => i.bloodGroup === transferForm.bloodGroup)?.units ?? 1}
                  value={transferForm.units}
                  onChange={(e) =>
                    setTransferForm((p) => ({ ...p, units: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2.5 bg-background border border-border font-mono text-sm focus:border-primary outline-none"
                />
              </label>
            </div>
            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setTransferTarget(null)}
                className="px-4 py-2 border border-border font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring}
                className="px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground disabled:opacity-50"
              >
                {transferring ? "Transferring..." : "Confirm Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
