import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, MapPin, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { BloodTag } from "@/components/UrgencyBadge";
import { ReportDialog } from "@/components/ReportDialog";
import { getDonorsData } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";

export const Route = createFileRoute("/_app/search")({
  head: () => ({
    meta: [
      { title: "Nearby Search — Donor Land" },
      { name: "description", content: "Find available donors within a configurable radius." },
    ],
  }),
  loader: () => getDonorsData(),
  component: SearchPage,
});

const LEVELS = ["Local", "District"];

function SearchPage() {
  const { donors } = Route.useLoaderData();
  const session = getSessionUser();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"Local" | "District">("District");
  const [loading, setLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  const results = useMemo(() => {
    return donors
      // Exclude self
      .filter((d) => {
        if (session?.phone && d.phone) {
          const myDigits = session.phone.replace(/[^\d]/g, "").slice(-10);
          const dDigits = d.phone.replace(/[^\d]/g, "").slice(-10);
          if (myDigits === dDigits) return false;
        }
        return true;
      })
      .map((d) => {
        const sameConstituency = d.constituency === session?.constituency;
        const sameDistrict = d.city === session?.district;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return {
          ...d,
          matchLevel,
        };
      })
      .filter((d) => (level === "Local" ? d.matchLevel === 1 : d.matchLevel <= 2))
      .filter((d) =>
        q.trim()
          ? d.name.toLowerCase().includes(q.toLowerCase()) ||
            d.bloodGroup.toLowerCase().includes(q.toLowerCase()) ||
            d.city.toLowerCase().includes(q.toLowerCase()) ||
            d.constituency.toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [q, level, donors, session]);

  // Simulate loading on radius change
  const onLevel = (l: "Local" | "District") => {
    setLoading(true);
    setLevel(l);
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Geo Scan</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Nearby Donors</h1>
      </header>

      <div className="hud-panel p-5 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex-1 flex items-center gap-3 border border-border bg-background px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search donors by name, blood type, or district"
            className="flex-1 py-3 bg-transparent outline-none text-sm font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => onLevel(l as any)}
              className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-colors ${
                level === l ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted"
              }`}
            >
              {l === "Local" ? "Constituency" : "District Wide"}
            </button>
          ))}
        </div>
      </div>

      <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        {loading ? "Loading..." : `${results.length} donor${results.length === 1 ? "" : "s"} found`}
      </div>

      {loading ? (
        <div className="grid gap-px bg-border border border-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface p-5 flex items-center gap-4 animate-pulse">
              <div className="size-10 bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted w-32" />
                <div className="h-3 bg-muted w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="hud-panel divide-y divide-border">
          {results.map((d) => (
            <div key={d.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div className="size-10 bg-muted flex items-center justify-center font-mono text-sm font-bold">
                  {d.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="font-bold">{d.name}</div>
                  <div className="font-mono text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <MapPin className="size-3" /> {d.city} · {d.constituency}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BloodTag group={d.bloodGroup} />
                <span className={`font-mono text-[10px] tracking-widest uppercase font-bold px-2 py-1 border ${d.available ? "text-success border-success/30 bg-success/10" : "text-muted-foreground border-border"}`}>
                  {d.available ? "● Ready" : "Off Duty"}
                </span>
                
                <div className="flex items-center gap-1 ml-2">
                  <a
                    href={d.phone ? `tel:${d.phone}` : undefined}
                    className="p-2 border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Call Donor"
                    onClick={(e) => { if (!d.phone) { e.preventDefault(); toast.error("No phone"); } }}
                  >
                    <Phone className="size-4" />
                  </a>
                  <a
                    href={d.phone ? `https://wa.me/${d.phone.replace(/[^\d]/g, "")}` : undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-border hover:bg-muted transition-colors"
                    title="WhatsApp Donor"
                    onClick={(e) => { if (!d.phone) { e.preventDefault(); toast.error("No phone"); } }}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                  <button
                    onClick={() => setReportTarget(d.phone ?? d.email ?? d.id)}
                    className="p-2 border border-border text-primary/70 hover:bg-primary/5 transition-colors"
                    title="Report Donor"
                  >
                    <AlertTriangle className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reportTarget && (
            <ReportDialog
              targetRole="donor"
              targetPhoneOrEmail={reportTarget}
              onClose={() => setReportTarget(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hud-panel p-12 text-center">
      <MapPin className="size-10 text-muted-foreground mx-auto mb-4" strokeWidth={1.25} />
      <h2 className="font-bold text-lg mb-1">No donors in selected area</h2>
      <p className="text-sm text-muted-foreground">Try expanding your search or clearing filters.</p>
    </div>
  );
}
