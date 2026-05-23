import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, MessageCircle, CheckCircle2, Trash2 } from "lucide-react";
import { BloodTag, UrgencyBadge } from "@/components/UrgencyBadge";
import { getNearbyRequestsForHospital, getMyRequests, deleteBloodRequest, markRequestFulfilled } from "@/lib/client-api";
import { getSessionUser } from "@/lib/session";
import type { BloodRequest } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/nearby-requests")({
  head: () => ({
    meta: [
      { title: "Blood Requests Around Us — Donor Land" },
      { name: "description", content: "View nearby blood requests from donors." },
    ],
  }),
  component: NearbyRequestsPage,
});

type RequestWithMatch = BloodRequest & { matchLevel?: number };

function NearbyRequestsPage() {
  const session = getSessionUser();
  const [requests, setRequests] = useState<RequestWithMatch[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [level, setLevel] = useState<"Local" | "District">("District");
  const [loading, setLoading] = useState(true);

  // Stabilize session values so useEffect doesn't infinite loop
  const district = session?.district;
  const constituency = session?.constituency;
  const phone = session?.phone;
  const email = session?.email;

  useEffect(() => {
    if (!district) { setLoading(false); return; }
    setLoading(true);
    getNearbyRequestsForHospital({ data: { district: district as any, constituency, phone, email } })
      .then((res) => {
        setRequests(res.requests as RequestWithMatch[]);
      })
      .catch(() => toast.error("Could not load nearby requests"))
      .finally(() => setLoading(false));
  }, [district, constituency, phone, email]);

  useEffect(() => {
    if (!phone && !email) return;
    getMyRequests({ data: { phone, email } })
      .then((res) => setMyRequests(res.requests))
      .catch(() => {});
  }, [phone, email]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (level === "Local") return r.matchLevel === 1;
      return (r.matchLevel ?? 3) <= 2;
    });
  }, [requests, level]);

  const handleDelete = async (requestId: string) => {
    if (!phone) return;
    try {
      await deleteBloodRequest({ data: { requestId, requesterPhone: phone } });
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Request cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  const handleFulfill = async (requestId: string) => {
    if (!phone) return;
    try {
      await markRequestFulfilled({ data: { requestId, requesterPhone: phone } });
      setMyRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "Fulfilled" } : r)));
      toast.success("Marked as fulfilled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  };

  const whatsappLink = (phoneNum: string | undefined, text: string) => {
    if (!phoneNum) return undefined;
    const digits = phoneNum.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Nearby Signals</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Blood Requests Around Us</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Active blood requests from donors within your range.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {(["Local", "District"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-6 py-2 font-mono text-[10px] tracking-widest uppercase font-bold transition-colors ${
                level === l ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted"
              }`}
            >
              {l === "Local" ? "Constituency" : "District Wide"}
            </button>
          ))}
        </div>
      </header>

      {/* My Requests Section */}
      {myRequests.length > 0 && (
        <section className="hud-panel">
          <div className="p-5 border-b border-border">
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">// My Dispatches</div>
            <h2 className="text-lg font-bold">My Requests</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {myRequests.map((r) => (
              <div key={r.id} className="bg-surface p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] tracking-widest uppercase text-primary font-bold mb-1">{r.id}</div>
                    <h3 className="font-bold truncate">{r.hospital}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="size-3" />
                      <span className="truncate">{r.location} · {r.constituency}</span>
                    </div>
                  </div>
                  <UrgencyBadge level={r.urgency} />
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-3">
                  <BloodTag group={r.bloodGroup} />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Status</span>
                    <span className="font-mono text-sm font-bold">{r.status} · {r.units}U</span>
                  </div>
                </div>
                {r.status !== "Fulfilled" && (
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleFulfill(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-success/10 text-success border border-success/30 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-success hover:text-white transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" /> Fulfilled
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Trash2 className="size-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="hud-panel p-12 text-center text-muted-foreground font-mono text-sm">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="hud-panel p-12 text-center">
          <MapPin className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No active blood requests in your {level === "Local" ? "constituency" : "district"}.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {filtered.map((r) => (
            <div key={r.id} className="bg-surface p-5 flex flex-col gap-3 h-full border border-transparent hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.id}</div>
                  <h3 className="font-bold">{r.hospital}</h3>
                  <div className="text-xs text-muted-foreground">{r.requesterName || "Unknown requester"}</div>
                </div>
                <UrgencyBadge level={r.urgency} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <BloodTag group={r.bloodGroup} />
                <span className="font-mono">{r.units}U</span>
                <span className="font-mono">· {r.location} ({r.constituency})</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <a
                  href={r.requesterPhone ? `tel:${r.requesterPhone}` : undefined}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-foreground text-background py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors"
                  onClick={(e) => { if (!r.requesterPhone) { e.preventDefault(); toast.error("No phone"); } }}
                >
                  <Phone className="size-3.5" /> Call
                </a>
                <a
                  href={whatsappLink(r.requesterPhone, `Hi, regarding your blood request ${r.id} for ${r.units}U ${r.bloodGroup}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                  onClick={(e) => { if (!r.requesterPhone) { e.preventDefault(); toast.error("No phone"); } }}
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
