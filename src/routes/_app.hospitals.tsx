import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Phone, MessageCircle, MapPin, CheckCircle2 } from "lucide-react";
import { getNearbyHospitals } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";


export const Route = createFileRoute("/_app/hospitals")({
  head: () => ({
    meta: [
      { title: "Nearby Hospitals — Donor Land" },
      { name: "description", content: "Find and contact nearby hospitals for blood requests." },
    ],
  }),
  component: NearbyHospitalsPage,
});

type HospitalEntry = {
  name: string;
  phone?: string;
  email?: string;
  district: string;
  constituency?: string;
  address?: string;
  verified?: boolean;
  matchLevel: number;
};

function NearbyHospitalsPage() {
  const session = getSessionUser();
  const [hospitals, setHospitals] = useState<HospitalEntry[]>([]);
  const [level, setLevel] = useState<"Local" | "District">("District");
  const [loading, setLoading] = useState(true);

  // Stabilize session values for dependency
  const district = session?.district;
  const constituency = session?.constituency;
  const email = session?.email;

  useEffect(() => {
    if (!district) { setLoading(false); return; }
    setLoading(true);
    getNearbyHospitals({ data: { district: district as any, constituency, email } })
      .then((res) => {
        const mapped = (res.hospitals as any[]).filter(h => {
          if (level === "Local") return h.matchLevel === 1;
          return h.matchLevel <= 2;
        });
        setHospitals(mapped);
      })
      .catch(() => toast.error("Could not load nearby hospitals"))
      .finally(() => setLoading(false));
  }, [level, district, constituency, email]);

  const whatsappLink = (phone: string | undefined, text: string) => {
    if (!phone) return undefined;
    const digits = phone.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : undefined;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Hospital Radar</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Nearby Hospitals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find hospitals in your vicinity and contact them for blood requests.
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
        <div className="hud-panel p-12 text-center text-muted-foreground font-mono text-sm">Scanning for hospitals...</div>
      ) : hospitals.length === 0 ? (
        <div className="hud-panel p-12 text-center">
          <Building2 className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hospitals found in your {level === "Local" ? "constituency" : "district"}.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {hospitals.map((h) => (
            <div key={h.email ?? h.name} className="bg-surface p-5 flex flex-col gap-3 h-full">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{h.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {h.district}
                    </div>
                  </div>
                </div>
                {h.verified && (
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase text-success border border-success/30 bg-success/10 px-1.5 py-0.5">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                )}
              </div>

              {h.address && (
                <p className="text-xs text-muted-foreground">{h.address}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span className="font-mono">{h.district} · {h.constituency}</span>
                {h.phone && <span className="font-mono">{h.phone}</span>}
              </div>

              <div className="flex gap-2 mt-auto">
                <a
                  href={h.phone ? `tel:${h.phone}` : undefined}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-foreground text-background py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors"
                  onClick={(e) => { if (!h.phone) { e.preventDefault(); toast.error("No phone number available"); } }}
                >
                  <Phone className="size-3.5" /> Call
                </a>
                <a
                  href={whatsappLink(h.phone, `Hi ${h.name}, I need blood. Can you help? My blood group is ${session?.bloodGroup ?? "unknown"}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                  onClick={(e) => { if (!h.phone) { e.preventDefault(); toast.error("No phone number available"); } }}
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
