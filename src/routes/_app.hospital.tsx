import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Siren, Users, MapPin, Award, Link2, Trash2 } from "lucide-react";
import type { InventoryItem, Donor, BloodRequest } from "@/lib/mock-data";
import { BloodTag, UrgencyBadge } from "@/components/UrgencyBadge";
import {
  getHospitalData,
  getMyRequests,
  deleteBloodRequest,
  markRequestFulfilled,
} from "@/lib/client-api";
import { getSessionUser } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital Dashboard — Donor Land" },
      { name: "description", content: "Hospital operations overview." },
    ],
  }),
  component: HospitalDashboardPage,
});

function HospitalDashboardPage() {
  const session = getSessionUser();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);

  const phone = session?.phone;
  const email = session?.email;

  useEffect(() => {
    let active = true;
    getHospitalData()
      .then((data) => {
        if (!active) return;
        setRequests(data.requests);
        setInventory(data.inventory);
        setDonors(data.donors);
      })
      .catch(() => toast.error("Could not load hospital data"));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!phone && !email) return;
    getMyRequests({ data: { phone, email } })
      .then((res) => setMyRequests(res.requests))
      .catch(() => {});
  }, [phone, email]);

  const activeRequests = useMemo(
    () =>
      requests
        .filter((r) => r.status !== "Fulfilled")
        // Exclude own requests from "others' requests"
        .filter((r) => {
          if (
            phone &&
            r.requesterPhone &&
            r.requesterPhone.replace(/[^\d]/g, "").endsWith(phone.replace(/[^\d]/g, "").slice(-10))
          )
            return false;
          if (email && r.requesterEmail === email) return false;
          return true;
        }),
    [requests, phone, email],
  );

  const lowStock = useMemo(() => inventory.filter((i) => i.units / i.capacity < 0.25), [inventory]);

  const deleteRequest = async (requestId: string) => {
    if (!session) return;
    try {
      await deleteBloodRequest({ data: { requestId } });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Request deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete request");
    }
  };

  const fulfillRequest = async (requestId: string) => {
    if (!session) return;
    try {
      await markRequestFulfilled({ data: { requestId } });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "Fulfilled" } : r)),
      );
      setMyRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "Fulfilled" } : r)),
      );
      toast.success("Marked as fulfilled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update request");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">
          // Hospital Operations
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">
          Hospital Dashboard
        </h1>
      </header>

      {/* Hospital Info */}
      <div className="hud-panel p-4 sm:p-5">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Hospital Details
        </div>
        <div className="font-bold">{session?.name ?? "Unknown Hospital"}</div>
        <div className="text-xs text-muted-foreground">
          {session?.address ?? "Address not set"} · {session?.district ?? "No location"}
        </div>
      </div>

      {/* Overview stat cards that link to modules */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <LinkCard
          to="/request"
          label="Active Requests"
          value={activeRequests.length}
          icon={Siren}
        />
        <LinkCard to="/donors" label="Matched Donors" value={donors.length} icon={Users} />
        <LinkCard to="/inventory" label="Low Stock Alerts" value={lowStock.length} icon={Bell} />
        <LinkCard to="/hospital-chain" label="Hospital Chain" value={0} icon={Link2} badge="New" />
      </div>

      {/* Quick links to new modules */}
      <div className="grid sm:grid-cols-3 gap-px bg-border border border-border">
        <QuickLink
          to="/nearby-requests"
          icon={MapPin}
          label="Requests Around Us"
          description="View nearby blood requests from donors"
        />
        <QuickLink
          to="/certify"
          icon={Award}
          label="Certify Donors"
          description="Certify a donor and increase lifetime count"
        />
        <QuickLink
          to="/hospital-chain"
          icon={Link2}
          label="Hospital Chain"
          description="Transfer blood between hospitals"
        />
      </div>

      {/* My Requests Section */}
      {myRequests.length > 0 && (
        <section className="hud-panel">
          <div className="p-5 border-b border-border">
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
              // My Dispatches
            </div>
            <h2 className="text-lg font-bold">My Requests</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {myRequests.map((r) => (
              <div key={r.id} className="bg-surface p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] tracking-widest uppercase text-primary font-bold mb-1">
                      {r.id}
                    </div>
                    <h3 className="font-bold truncate">{r.hospital}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="size-3" />
                      <span className="truncate">
                        {r.location} · {r.constituency}
                      </span>
                    </div>
                  </div>
                  <UrgencyBadge level={r.urgency} />
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-3">
                  <BloodTag group={r.bloodGroup} />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
                      Status
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {r.status} · {r.units}U
                    </span>
                  </div>
                </div>
                {r.status !== "Fulfilled" && (
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => fulfillRequest(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-success/10 text-success border border-success/30 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-success hover:text-white transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" /> Fulfilled
                    </button>
                    <button
                      onClick={() => deleteRequest(r.id)}
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

      {/* Active Requests (from others) — Card Layout */}
      <section id="active-requests" className="hud-panel">
        <div className="p-5 border-b border-border">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            // Incoming Signals
          </div>
          <h2 className="text-lg font-bold">Active Requests</h2>
        </div>
        {activeRequests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
            No active requests right now.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {activeRequests.map((request) => (
              <div
                key={request.id}
                className="bg-surface p-5 flex flex-col gap-3 border border-transparent hover:border-primary/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[9px] tracking-widest uppercase text-primary font-bold mb-1">
                      {request.id}
                    </div>
                    <h3 className="font-bold truncate">{request.hospital}</h3>
                    {request.requesterName && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {request.requesterName}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <MapPin className="size-3" />
                      <span className="truncate">
                        {request.location} · {request.constituency}
                      </span>
                    </div>
                  </div>
                  <UrgencyBadge level={request.urgency} />
                </div>
                <div className="flex items-center gap-3 bg-muted/50 p-3">
                  <BloodTag group={request.bloodGroup} />
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
                      Quantity
                    </span>
                    <span className="font-mono text-sm font-bold">
                      {request.units}U · {request.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LinkCard({
  to,
  label,
  value,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  value: number;
  icon: React.ElementType;
  badge?: string;
}) {
  return (
    <Link to={to} className="bg-surface p-4 hover:bg-muted transition-colors relative block">
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          {label}
        </div>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="font-mono text-2xl font-bold tabular-nums">{value}</div>
      {badge && (
        <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-1.5 py-0.5 font-mono text-[8px] tracking-widest uppercase font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="bg-surface p-5 hover:bg-muted transition-colors flex items-start gap-4 group"
    >
      <div className="size-10 bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-bold text-sm">{label}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
