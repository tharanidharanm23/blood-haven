import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Search, CheckCircle2 } from "lucide-react";
import { BloodTag } from "@/components/UrgencyBadge";
import { certifyDonation, searchDonorsForCertify } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";
import type { Donor, District } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/certify")({
  head: () => ({
    meta: [
      { title: "Certify Donors — Donor Land" },
      { name: "description", content: "Search and certify blood donors to increase their lifetime contributions." },
    ],
  }),
  component: CertifyPage,
});

function CertifyPage() {
  const session = getSessionUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Donor[]>([]);
  const [searching, setSearching] = useState(false);
  const [certifying, setCertifying] = useState<string | null>(null);
  const [certified, setCertified] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 1) return;
    setSearching(true);
    try {
      const res = await searchDonorsForCertify({ data: { query: query.trim() } });
      setResults(res.donors);
      if (res.donors.length === 0) toast("No donors found for that search.");
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleCertify = async (donor: Donor) => {
    if (!session?.email) { toast.error("Hospital session missing"); return; }
    setCertifying(donor.id);
    try {
      const result = await certifyDonation({
        data: {
          donorId: donor.id,
          hospitalEmail: session.email,
          hospitalName: session.name,
          location: (session.district as District) ?? "Chennai",
        },
      });
      setCertified((prev) => new Set(prev).add(donor.id));
      setResults((prev) =>
        prev.map((d) => d.id === donor.id ? { ...d, lifetimeDonations: result.lifetimeDonations, lastDonation: new Date().toISOString().slice(0, 10) } : d)
      );
      toast.success(`${donor.name} certified! Lifetime: ${result.lifetimeDonations}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Certification failed");
    } finally {
      setCertifying(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Certification</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Certify Donors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search for a donor by name, phone, or ID and certify their blood donation.
        </p>
      </header>

      <form onSubmit={handleSearch} className="hud-panel p-5 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter donor name, phone number, or ID..."
            className="w-full pl-10 pr-3 py-3 bg-background border border-border font-mono text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="bg-primary text-primary-foreground px-6 py-3 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-foreground transition-colors disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
          {results.map((donor) => {
            const isCertified = certified.has(donor.id);
            return (
              <div key={donor.id} className="bg-surface p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
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
                <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-border py-3">
                  <div>
                    <div className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Lifetime</div>
                    <div className="font-mono text-lg font-bold">{donor.lifetimeDonations ?? 0}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Status</div>
                    <div className={`font-mono text-xs font-bold ${donor.available ? "text-success" : "text-muted-foreground"}`}>
                      {donor.available ? "READY" : "OFF"}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">Last</div>
                    <div className="font-mono text-xs">{donor.lastDonation?.slice(5) ?? "-"}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleCertify(donor)}
                  disabled={certifying === donor.id || isCertified}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold transition-colors ${
                    isCertified
                      ? "bg-success/20 text-success border border-success/30 cursor-default"
                      : "bg-primary text-primary-foreground hover:bg-foreground disabled:opacity-50"
                  }`}
                >
                  {isCertified ? (
                    <><CheckCircle2 className="size-3.5" /> Certified</>
                  ) : certifying === donor.id ? (
                    "Certifying..."
                  ) : (
                    <><Award className="size-3.5" /> Certify +1</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && !searching && (
        <div className="hud-panel p-12 text-center">
          <Award className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Search for a donor above to begin certification.</p>
        </div>
      )}
    </div>
  );
}
