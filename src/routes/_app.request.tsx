import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import {
  BLOOD_GROUPS,
  TAMIL_NADU_DISTRICTS,
  DISTRICT_CONSTITUENCIES,
  type BloodGroup,
  type District,
  type Urgency,
} from "@/lib/mock-data";
import { createBloodRequest } from "@/lib/server/api";
import { getSessionUser } from "@/lib/session";

export const Route = createFileRoute("/_app/request")({
  head: () => ({
    meta: [
      { title: "Blood Request — Donor Land" },
      { name: "description", content: "Submit a new blood request to the network." },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O-");
  const [units, setUnits] = useState(1);
  const [urgency, setUrgency] = useState<Urgency>("Urgent");
  const [location, setLocation] = useState<District>("Chennai");
  const [constituency, setConstituency] = useState<string>("Kolathur");
  const [submitted, setSubmitted] = useState<null | { id: string }>(null);
  const [loading, setLoading] = useState(false);
  const [lock, setLock] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock) return;
    setLock(true);
    setLoading(true);
    try {
      const session = getSessionUser();
      const result = await createBloodRequest({
        data: {
          bloodGroup,
          units,
          urgency,
          location,
          constituency,
          requesterEmail: session?.email,
          requesterPhone: session?.phone,
        },
      });
      toast.success("Request dispatched successfully!");
      setSubmitted({ id: result.request.id });
    } finally {
      setLoading(false);
      setTimeout(() => setLock(false), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// New Dispatch</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Request Blood</h1>
        <p className="text-sm text-muted-foreground mt-1">Broadcast your need to the network.</p>
      </header>

      {submitted ? (
        <div className="hud-panel p-8 text-center">
          <CheckCircle2 className="size-12 text-success mx-auto mb-4" strokeWidth={1.5} />
          <div className="font-mono text-[10px] tracking-widest uppercase text-success mb-2">// Request Broadcast</div>
          <h2 className="text-2xl font-bold mb-2">{submitted.id} dispatched</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Network is matching {units} unit{units > 1 ? "s" : ""} of <strong>{bloodGroup}</strong> for {location}.
          </p>
          <div className="grid grid-cols-3 gap-px bg-border border border-border max-w-md mx-auto">
            <Stat label="Request ID" value={submitted.id} />
            <Stat label="Units" value={`${units}U`} />
            <Stat label="Urgency" value={urgency} />
          </div>
          <button
            onClick={() => setSubmitted(null)}
            className="mt-6 border border-border px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
          >
            New Request
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="hud-panel p-6 sm:p-8 flex flex-col gap-5">
          <Field label="Blood Group">
            <div className="grid grid-cols-4 gap-px bg-border border border-border">
              {BLOOD_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBloodGroup(g)}
                  className={`py-3 font-mono text-sm font-bold transition-colors ${
                    bloodGroup === g ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-muted"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Units Required">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={20}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="font-mono text-2xl font-bold tabular-nums w-12 text-right">{units}</span>
            </div>
          </Field>

          <Field label="Urgency Level">
            <div className="grid grid-cols-3 gap-px bg-border border border-border">
              {(["Normal", "Urgent", "Critical"] as Urgency[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`py-3 font-mono text-xs tracking-widest uppercase font-bold transition-colors ${
                    urgency === u
                      ? u === "Critical"
                        ? "bg-primary text-primary-foreground"
                        : u === "Urgent"
                        ? "bg-warning text-foreground"
                        : "bg-foreground text-background"
                      : "bg-surface hover:bg-muted"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </Field>

          <Field label="District">
            <select
              value={location}
              onChange={(e) => {
                const district = e.target.value as District;
                setLocation(district);
                setConstituency(DISTRICT_CONSTITUENCIES[district][0]);
              }}
              className="w-full px-3.5 py-3 bg-surface border border-border font-mono text-sm focus:border-primary outline-none"
            >
              {TAMIL_NADU_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Constituency">
            <select
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              className="w-full px-3.5 py-3 bg-surface border border-border font-mono text-sm focus:border-primary outline-none"
            >
              {DISTRICT_CONSTITUENCIES[location].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={loading || lock}
            className="bg-primary text-primary-foreground py-3 font-mono text-xs tracking-widest uppercase font-bold hover:bg-foreground transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : lock ? "Submitted" : "Dispatch Request"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground mb-1">{label}</div>
      <div className="font-mono text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
