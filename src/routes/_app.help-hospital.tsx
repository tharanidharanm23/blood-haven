import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, MessageCircle, Building2, CheckCircle2, Trash2 } from "lucide-react";
import { BloodTag, UrgencyBadge } from "@/components/UrgencyBadge";
import { getNearbyRequestsForHospital } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";
import type { BloodRequest } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/help-hospital")({
  head: () => ({
    meta: [
      { title: "Help Hospital — Donor Land" },
      { name: "description", content: "View and respond to blood requests from nearby hospitals." },
    ],
  }),
  component: HelpHospitalPage,
});

type RequestWithMatch = BloodRequest & { matchLevel?: number };

function HelpHospitalPage() {
  const session = getSessionUser();
  const [requests, setRequests] = useState<RequestWithMatch[]>([]);
  const [level, setLevel] = useState<"Local" | "District">("District");
  const [loading, setLoading] = useState(true);

  // Stabilize session values for dependency
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
      .catch(() => toast.error("Could not load hospital requests"))
      .finally(() => setLoading(false));
  }, [district, constituency, phone, email]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (level === "Local") return r.matchLevel === 1;
      return (r.matchLevel ?? 3) <= 2;
    });
  }, [requests, level]);

  const whatsappLink = (phoneNum: string | undefined, text: string) => {
    if (!phoneNum) return undefined;
    const digits = phoneNum.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Network Assistance</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Help Hospital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Nearby hospitals requiring immediate blood units. Your response saves lives.
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

      {loading ? (
        <div className="hud-panel p-12 text-center text-muted-foreground font-mono text-sm">Scanning for hospital signals...</div>
      ) : filtered.length === 0 ? (
        <div className="hud-panel p-12 text-center">
          <Building2 className="size-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.25} />
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">No active requests found in your area.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {filtered.map((r) => (
            <div key={r.id} className="bg-surface p-5 flex flex-col gap-4 h-full border border-transparent hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[9px] tracking-widest uppercase text-primary font-bold mb-1">{r.id}</div>
                  <h3 className="font-bold text-lg truncate leading-tight">{r.hospital}</h3>
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
                  <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Quantity Required</span>
                  <span className="font-mono text-sm font-bold">{r.units} Units</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-2">
                <a
                  href={r.requesterPhone ? `tel:${r.requesterPhone}` : undefined}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-foreground text-background py-3 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors"
                  onClick={(e) => { if (!r.requesterPhone) { e.preventDefault(); toast.error("No phone available"); } }}
                >
                  <Phone className="size-3.5" /> Call
                </a>
                <a
                  href={whatsappLink(r.requesterPhone, `Hi, I am a donor. I saw your request ${r.id} for ${r.units}U of ${r.bloodGroup}. I can help.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-3 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                  onClick={(e) => { if (!r.requesterPhone) { e.preventDefault(); toast.error("No phone available"); } }}
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
