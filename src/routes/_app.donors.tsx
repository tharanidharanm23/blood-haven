import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Star, Siren, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { ReportDialog } from "@/components/ReportDialog";
import type { Donor } from "@/lib/mock-data";
import { BloodTag, UrgencyBadge } from "@/components/UrgencyBadge";
import { getDonorsData } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";

export const Route = createFileRoute("/_app/donors")({
  head: () => ({
    meta: [
      { title: "Donor Match — Donor Land" },
      { name: "description", content: "Smart-matched donors for active blood requests." },
    ],
  }),
  loader: () => getDonorsData(),
  component: DonorsPage,
});

type Sort = "location" | "eligible";

function DonorsPage() {
  const { donors, requests } = Route.useLoaderData();
  const session = getSessionUser();
  const [sort, setSort] = useState<Sort>("location");

  const sorted = useMemo(() => {
    const list = donors
      // Exclude self
      .filter((donor) => {
        if (session?.phone && donor.phone) {
          const myDigits = session.phone.replace(/[^\d]/g, "").slice(-10);
          const dDigits = donor.phone.replace(/[^\d]/g, "").slice(-10);
          if (myDigits === dDigits) return false;
        }
        return true;
      })
      .map((donor) => {
        const sameConstituency = donor.constituency === session?.constituency;
        const sameDistrict = donor.city === session?.district;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return {
          ...donor,
          matchLevel,
        };
      });

    if (sort === "location") return list.sort((a, b) => a.matchLevel - b.matchLevel);
    // "eligible" — available + most recent gap (older lastDonation = more eligible)
    return list.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      return a.lastDonation.localeCompare(b.lastDonation);
    });
  }, [sort, donors, session]);

  const critical = requests.filter((r) => r.urgency === "Critical");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Match Engine</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Smart Donor Match</h1>
          <p className="text-sm text-muted-foreground mt-1">Ranked by proximity and eligibility window.</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {(["location", "eligible"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold transition-colors ${
                sort === s ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted"
              }`}
            >
              {s === "location" ? "Location" : "Most Eligible"}
            </button>
          ))}
        </div>
      </header>

      {/* Emergency band */}
      {critical.length > 0 && (
        <div className="hud-panel border-primary/40 bg-primary/5">
          <div className="p-5 border-b border-primary/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Siren className="size-5 text-primary animate-pulse" />
              <div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-primary font-bold">
                  Active Emergencies
                </div>
                <h2 className="text-lg font-bold">{critical.length} critical request{critical.length > 1 ? "s" : ""}</h2>
              </div>
            </div>
            <button
              onClick={() => toast.success("Donor contacts opened")}
              className="bg-primary text-primary-foreground px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground transition-colors"
            >
              Contact Donors
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-primary/20">
            {critical.map((r) => (
              <div key={r.id} className="bg-surface p-4 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] text-primary font-bold">{r.id}</div>
                  <div className="font-bold text-sm">{r.hospital}</div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                    {r.units}U · {r.location}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <BloodTag group={r.bloodGroup} />
                  <UrgencyBadge level={r.urgency} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {sorted.map((d, i) => <DonorCard key={d.id} donor={d} best={i === 0 && sort === "location"} />)}
      </div>
    </div>
  );
}

function DonorCard({ donor, best }: { donor: Donor & { matchLevel: number }; best: boolean }) {
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  const whatsappLink = (phone: string | undefined, name: string) => {
    if (!phone) return undefined;
    const digits = phone.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hi ${name}, I saw your profile on Donor Haven. Are you available for a blood donation?`)}` : undefined;
  };

  return (
    <div className={`bg-surface p-5 relative flex flex-col h-full ${best ? "ring-2 ring-primary -m-px z-10" : ""}`}>
      {best && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 font-mono text-[9px] tracking-widest uppercase font-bold flex items-center gap-1">
          <Star className="size-3" /> Top Match
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-muted text-foreground flex items-center justify-center font-mono text-sm font-bold">
            {donor.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="font-mono text-[10px] text-muted-foreground">{donor.id}</div>
            <h3 className="font-bold text-sm">{donor.name}</h3>
          </div>
        </div>
        <BloodTag group={donor.bloodGroup} />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4 text-center border-t border-b border-border py-3">
        <KV label="Level" value={donor.matchLevel === 1 ? "LOCAL" : donor.matchLevel === 2 ? "DISTRICT" : "FAR"} />
        <KV label="Status" value={donor.available ? "READY" : "OFF"} tone={donor.available ? "success" : "muted"} />
        <KV label="Last" value={donor.lastDonation.slice(5)} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <a
          href={donor.phone ? `tel:${donor.phone}` : undefined}
          className="flex items-center justify-center gap-2 bg-foreground text-background py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors disabled:opacity-40"
          onClick={(e) => { if (!donor.phone) { e.preventDefault(); toast.error("No phone number"); } }}
        >
          <Phone className="size-3.5" /> Call
        </a>
        <a
          href={whatsappLink(donor.phone, donor.name)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border border-border py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
          onClick={(e) => { if (!donor.phone) { e.preventDefault(); toast.error("No phone number"); } }}
        >
          <MessageCircle className="size-3.5" /> WhatsApp
        </a>
        <button
          onClick={() => setReportTarget(donor.phone ?? donor.email ?? donor.id)}
          className="col-span-2 flex items-center justify-center gap-2 border border-primary/20 text-primary/70 py-2 font-mono text-[9px] tracking-widest uppercase font-bold hover:bg-primary/5 transition-colors"
        >
          <AlertTriangle className="size-3" /> Report Donor
        </button>
      </div>

      {reportTarget && (
        <ReportDialog
          targetRole="donor"
          targetPhoneOrEmail={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

function KV({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "muted" }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">{label}</div>
      <div className={`font-mono text-xs font-bold tabular-nums ${tone === "success" ? "text-success" : tone === "muted" ? "text-muted-foreground" : ""}`}>{value}</div>
    </div>
  );
}
