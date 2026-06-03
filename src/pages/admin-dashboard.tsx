import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Check,
  ShieldCheck,
  Trash2,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { UrgencyBadge, BloodTag } from "@/components/UrgencyBadge";
import {
  adminRemoveRequest,
  adminRemoveUser,
  adminResolveReport,
  adminSetUserApproval,
  adminVerifyHospital,
  getAdminData,
} from "@/lib/client-api";
import type { Report } from "@/lib/reports";
import {
  type BloodRequest,
  type Donor,
  type InventoryItem,
  type Role,
  bloodDistribution as seedBloodDistribution,
  monthlyRequests as seedMonthlyRequests,
} from "@/lib/mock-data";

type AdminUser = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  district: string;
  constituency: string;
  bloodGroup?: string;
  approved?: boolean;
  verified?: boolean;
};

const PALETTE = [
  "var(--color-primary)",
  "var(--color-foreground)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-muted-foreground)",
  "oklch(0.4 0.18 18)",
  "oklch(0.7 0.15 200)",
  "oklch(0.55 0.15 280)",
];

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin"],
    queryFn: getAdminData,
  });

  const users = (data?.users ?? []) as AdminUser[];
  const requests = data?.requests ?? [];
  const donors = data?.donors ?? [];
  const reports = data?.reports ?? [];
  const inventory = data?.inventory ?? [];
  const monthlyRequests = data?.monthlyRequests ?? seedMonthlyRequests;
  const bloodDistribution = data?.bloodDistribution ?? seedBloodDistribution;

  if (isLoading) {
    return (
      <div className="hud-panel p-8 text-center text-muted-foreground font-mono text-sm">
        Loading mission control...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="hud-panel p-8 text-center text-destructive font-mono text-sm">
        Could not load admin data. Is the API running?
      </div>
    );
  }

  const refreshAdmin = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const lowStock = inventory.filter((i) => i.units / i.capacity < 0.25);
  const activeRequests = requests.filter((r) => r.status !== "Fulfilled");
  const criticalRequests = requests.filter((r) => r.urgency === "Critical");
  const fulfilledRequests = requests.filter((r) => r.status === "Fulfilled");

  const donorsUsers = useMemo(() => users.filter((u) => u.role === "donor"), [users]);
  const hospitalUsers = useMemo(() => users.filter((u) => u.role === "hospital"), [users]);

  const setApproval = async (phoneOrEmail: string, approved: boolean) => {
    try {
      await adminSetUserApproval({ data: { phoneOrEmail, approved } });
      await refreshAdmin();
      toast.success(approved ? "User approved" : "User blocked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const verifyHospital = async (phoneOrEmail: string, verified: boolean) => {
    try {
      await adminVerifyHospital({ data: { phoneOrEmail, verified } });
      await refreshAdmin();
      toast.success(verified ? "Hospital verified" : "Hospital unverified");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const removeUser = async (phoneOrEmail: string) => {
    try {
      await adminRemoveUser({ data: { phoneOrEmail } });
      await refreshAdmin();
      toast.success("User removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  const removeRequest = async (requestId: string) => {
    try {
      await adminRemoveRequest({ data: { requestId } });
      await refreshAdmin();
      toast.success("Request removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">
            // Admin Console
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">
            Mission Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate telemetry across the regional network.
          </p>
        </div>
        <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Admin View
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <StatCard label="Total Donors" value={donors.length} delta="Active profiles" icon={Users} />
        <StatCard
          label="Active Requests"
          value={activeRequests.length}
          delta={`${criticalRequests.length} critical`}
          icon={Activity}
          tone="primary"
        />
        <StatCard
          label="Fulfilled (30d)"
          value={fulfilledRequests.length}
          delta="Stored requests"
          icon={CheckCircle2}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length}
          delta="Action required"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hud-panel p-6 lg:col-span-2">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
                Telemetry
              </div>
              <h2 className="text-lg font-bold">Monthly Requests</h2>
            </div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Last 6 months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyRequests}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <Bar dataKey="requests" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="hud-panel p-6">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            Distribution
          </div>
          <h2 className="text-lg font-bold mb-4">Blood Group Mix</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={bloodDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                stroke="var(--color-surface)"
                strokeWidth={2}
              >
                {bloodDistribution.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {bloodDistribution.map((b, i) => (
              <div key={b.name} className="flex items-center gap-1.5">
                <span className="size-2" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="font-mono text-[10px]">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hud-panel">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
              Recent Activity
            </div>
            <h2 className="text-lg font-bold">Request Stream</h2>
          </div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Requests
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                <th className="text-left p-3">Req ID</th>
                <th className="text-left p-3">Hospital</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Units</th>
                <th className="text-left p-3">Urgency</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Posted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-border hover:bg-muted/50 transition-colors ${
                    r.urgency === "Critical" ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="p-3 font-medium">{r.hospital}</td>
                  <td className="p-3">
                    <BloodTag group={r.bloodGroup} />
                  </td>
                  <td className="p-3 font-mono tabular-nums">{r.units}</td>
                  <td className="p-3">
                    <UrgencyBadge level={r.urgency} />
                  </td>
                  <td className="p-3 font-mono text-xs">{r.status}</td>
                  <td className="p-3 text-right flex items-center justify-end gap-2">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {r.postedMinutesAgo}m
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRequest(r.id)}
                      className="p-1 border border-border hover:bg-muted transition-colors"
                      aria-label="Remove request"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="hud-panel">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">District</th>
                  <th className="text-left p-3">Contact</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const key = u.phone ?? u.email ?? `${u.name}-${u.district}`;
                  const contact = u.phone ?? u.email ?? "-";
                  const handle = u.phone ?? u.email ?? "";
                  const approved = u.approved ?? true;
                  return (
                    <tr key={key} className="border-t border-border">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 font-mono text-xs uppercase">{u.role}</td>
                      <td className="p-3">{u.district}</td>
                      <td className="p-3 font-mono text-xs">{contact}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setApproval(handle, !approved)}
                            className={`px-2 py-1 border font-mono text-[10px] tracking-widest uppercase font-bold transition-colors ${
                              approved
                                ? "border-border hover:bg-muted"
                                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                            disabled={!handle}
                            title={approved ? "Block user" : "Approve user"}
                          >
                            {approved ? (
                              <>
                                <X className="inline size-3.5 mr-1" />
                                Block
                              </>
                            ) : (
                              <>
                                <Check className="inline size-3.5 mr-1" />
                                Approve
                              </>
                            )}
                          </button>
                          {u.role === "hospital" && (
                            <button
                              type="button"
                              onClick={() => verifyHospital(handle, !(u.verified ?? false))}
                              className="px-2 py-1 border border-border hover:bg-muted font-mono text-[10px] tracking-widest uppercase font-bold"
                              disabled={!handle}
                              title="Verify hospital"
                            >
                              <ShieldCheck className="inline size-3.5 mr-1" />
                              {u.verified ? "Verified" : "Verify"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeUser(handle)}
                            className="px-2 py-1 border border-border hover:bg-muted font-mono text-[10px] tracking-widest uppercase font-bold"
                            disabled={!handle}
                            title="Remove user"
                          >
                            <Trash2 className="inline size-3.5 mr-1" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="hud-panel">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold">Critical Alerts</h2>
          </div>
          <div className="divide-y divide-border">
            {criticalRequests.map((r) => (
              <div key={r.id} className="p-4 bg-primary/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{r.hospital}</span>
                  <UrgencyBadge level={r.urgency} />
                </div>
                <div className="font-mono text-xs text-muted-foreground mt-1">
                  {r.id} · {r.location} · {r.units}U {r.bloodGroup}
                </div>
              </div>
            ))}
            {criticalRequests.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No emergency alerts.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="hud-panel">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold">Donor Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  <th className="text-left p-3">Donor</th>
                  <th className="text-left p-3">Blood</th>
                  <th className="text-left p-3">District</th>
                  <th className="text-right p-3">Donations</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium">{d.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {d.phone ?? d.email ?? "-"}
                      </div>
                    </td>
                    <td className="p-3">
                      <BloodTag group={d.bloodGroup} />
                    </td>
                    <td className="p-3">{d.city}</td>
                    <td className="p-3 text-right font-mono tabular-nums">
                      {d.lifetimeDonations ?? 0}
                    </td>
                  </tr>
                ))}
                {donors.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={4} className="p-4 text-sm text-muted-foreground">
                      No donors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="hud-panel">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold">Hospital Management</h2>
          </div>
          <div className="divide-y divide-border">
            {hospitalUsers.map((h) => (
              <div
                key={h.phone ?? h.email ?? h.name}
                className="p-5 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-bold">{h.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {h.address ?? "-"} · {h.district ?? "-"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">
                    {h.phone ?? h.email ?? "-"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-mono text-[10px] tracking-widest uppercase px-2 py-1 border ${
                      h.verified
                        ? "text-success border-success/30 bg-success/10"
                        : "text-muted-foreground border-border"
                    }`}
                  >
                    {h.verified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
            ))}
            {hospitalUsers.length === 0 && (
              <div className="p-5 text-sm text-muted-foreground">No hospitals found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="hud-panel">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold">Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                <th className="text-left p-3">Report</th>
                <th className="text-left p-3">Reporter</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-mono text-xs text-muted-foreground">{r.id}</div>
                    <div className="text-sm">{r.description}</div>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {r.reporterRole} · {r.reporterPhone ?? r.reporterEmail ?? "-"}
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {r.targetRole} · {r.targetPhoneOrEmail}
                  </td>
                  <td className="p-3 font-mono text-xs uppercase">{r.status}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        const nextStatus = r.status === "open" ? "resolved" : "open";
                        try {
                          await adminResolveReport({
                            data: { reportId: r.id, status: nextStatus },
                          });
                          await refreshAdmin();
                          toast.success(
                            nextStatus === "resolved" ? "Report resolved" : "Report reopened",
                          );
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Update failed");
                        }
                      }}
                      className="px-2 py-1 border border-border hover:bg-muted font-mono text-[10px] tracking-widest uppercase font-bold"
                    >
                      {r.status === "open" ? "Resolve" : "Reopen"}
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={5} className="p-4 text-sm text-muted-foreground">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
