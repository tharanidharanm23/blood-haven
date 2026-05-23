import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Calendar, Droplets, Edit3, MessageCircle, Phone, X, CheckCircle2, Trash2 } from "lucide-react";
import { BloodTag, UrgencyBadge } from "@/components/UrgencyBadge";
import { ReportDialog } from "@/components/ReportDialog";
import {
  getDonorProfileByPhone,
  getDonorProfileData,
  updateDonorProfile,
  updateDonorAvailability,
  getMyRequests,
  deleteBloodRequest,
  markRequestFulfilled,
} from "@/lib/server/api";
import { getSessionUser, saveSessionUser } from "@/lib/session";
import {
  BLOOD_GROUPS,
  TAMIL_NADU_DISTRICTS,
  DISTRICT_CONSTITUENCIES,
  type BloodGroup,
  type District,
  type Donor,
  type BloodRequest,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/donor")({
  head: () => ({
    meta: [
      { title: "Donor Profile — Donor Land" },
      { name: "description", content: "Manage your donor profile and view nearby requests." },
    ],
  }),
  loader: async () => {
    const session = getSessionUser();
    return getDonorProfileData({ data: { phone: session?.phone } });
  },
  component: DonorPage,
});

function DonorPage() {
  const loaderData = Route.useLoaderData() as any;
  const [profile, setProfile] = useState(loaderData);
  const [available, setAvailable] = useState(loaderData?.me?.available ?? true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const { me, history, nearby, nearbyDonors = [], user } = profile || {};
  const [reportTarget, setReportTarget] = useState<null | { role: "donor" | "hospital"; id: string }>(null);

  const phone = getSessionUser()?.phone;
  const email = getSessionUser()?.email;

  useEffect(() => {
    const session = getSessionUser();
    if (!session?.phone) return;

    getDonorProfileByPhone({ data: { phone: session.phone } })
      .then((nextProfile) => {
        setProfile(nextProfile);
        setAvailable(nextProfile.me.available);
      })
      .catch(() => {
        toast.error("Could not load your MongoDB donor profile");
      });
  }, []);

  useEffect(() => {
    if (!phone && !email) return;
    getMyRequests({ data: { phone, email } })
      .then((res) => setMyRequests(res.requests))
      .catch(() => {});
  }, [phone, email]);

  const handleDeleteRequest = async (requestId: string) => {
    if (!phone) return;
    try {
      await deleteBloodRequest({ data: { requestId, requesterPhone: phone } });
      setMyRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Request cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  const handleFulfillRequest = async (requestId: string) => {
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
    if (!phoneNum) return null;
    const digits = phoneNum.replace(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">// Operative File</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Donor Profile</h1>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="hud-panel p-6 lg:col-span-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="size-16 bg-primary text-primary-foreground flex items-center justify-center font-mono text-xl font-bold">
              {user?.initials ?? me?.name?.split(" ").map((part: string) => part[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{me.id}</div>
              <h2 className="text-xl font-bold">{me.name}</h2>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <Row icon={Droplets} label="Blood Group"><BloodTag group={me.bloodGroup} /></Row>
            <Row icon={MapPin} label="Location"><span>{me.city}</span></Row>
            <Row icon={MapPin} label="Constituency"><span>{me.constituency}</span></Row>
            <Row icon={Calendar} label="Last Donation"><span className="font-mono">{me.lastDonation}</span></Row>
            <Row icon={Calendar} label="Lifetime"><span className="font-mono">{me.lifetimeDonations ?? history.length}</span></Row>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Status</div>
                <div className="text-sm font-bold">{available ? "Available for Dispatch" : "Off Duty"}</div>
              </div>
              <button
                onClick={() => {
                  const next = !available;
                  setAvailable(next);
                  updateDonorAvailability({ data: { donorId: me.id, available: next } });
                  toast.success(`Status set to ${next ? "Available" : "Off Duty"}`);
                }}
                className={`relative w-14 h-7 transition-colors ${available ? "bg-success" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 size-6 bg-surface transition-transform ${available ? "translate-x-7" : "translate-x-0.5"}`} />
              </button>
            </div>
            <button
              onClick={() => setEditorOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 border border-border py-2.5 font-mono text-xs tracking-widest uppercase font-bold hover:bg-muted transition-colors"
            >
              <Edit3 className="size-3.5" /> Update Profile
            </button>
          </div>
        </div>

        <div className="hud-panel lg:col-span-2 flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Donation History</div>
              <h2 className="text-lg font-bold">{history.length} lifetime contribution{history.length === 1 ? "" : "s"}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Hospital</th>
                <th className="text-left p-3">Location</th>
                <th className="text-right p-3">Units</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={`${h.date}-${h.location}`} className="border-t border-border">
                  <td className="p-3 font-mono">{h.date}</td>
                  <td className="p-3">{h.hospitalName ?? "-"}</td>
                  <td className="p-3">{h.location} ({h.constituency})</td>
                  <td className="p-3 text-right font-mono tabular-nums">{h.units}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr className="border-t border-border">
                  <td className="p-3 text-muted-foreground" colSpan={4}>
                    No donation history stored yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Requests Section */}
      {myRequests.length > 0 && (
        <div className="hud-panel">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">// My Dispatches</div>
              <h2 className="text-lg font-bold">My Requests</h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{myRequests.length} request{myRequests.length === 1 ? "" : "s"}</span>
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
                      onClick={() => handleFulfillRequest(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-success/10 text-success border border-success/30 py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-success hover:text-white transition-colors"
                    >
                      <CheckCircle2 className="size-3.5" /> Fulfilled
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(r.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2.5 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Trash2 className="size-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hud-panel">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Donor Radar</div>
            <h2 className="text-lg font-bold">Nearby Donors</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-px bg-border">
          {nearbyDonors.map((d: Donor) => (
            <div key={d.id} className="bg-surface p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground">{d.id}</div>
                  <h3 className="font-bold">{d.name}</h3>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1">
                    {d.city} · {d.constituency}
                  </div>
                </div>
                <BloodTag group={d.bloodGroup} />
              </div>
              <div className="mt-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                {d.available ? "Available" : "Off Duty"}
              </div>
              <a
                href={d.phone ? `tel:${d.phone}` : undefined}
                onClick={(e) => {
                  if (!d.phone) {
                    e.preventDefault();
                    toast.error("No contact number available");
                  }
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-foreground text-background py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors"
              >
                <Phone className="size-3.5" />
                Call Donor
              </a>
              <a
                href={whatsappLink(d.phone, `Hi ${d.name}, emergency donor contact needed. Are you available?`) ?? undefined}
                onClick={(e) => {
                  if (!d.phone) {
                    e.preventDefault();
                    toast.error("No contact number available");
                  }
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setReportTarget({ role: "donor", id: d.phone ?? d.id })}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
              >
                Report
              </button>
            </div>
          ))}
          {nearbyDonors.length === 0 && (
            <div className="bg-surface p-5 text-sm text-muted-foreground sm:col-span-2">
              No donors found in your area.
            </div>
          )}
        </div>
      </div>

      <div className="hud-panel">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Inbound Signals</div>
            <h2 className="text-lg font-bold">Nearby Requests</h2>
          </div>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{nearby.length} matches</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-px bg-border">
          {nearby.map((r: any) => (
            <div key={r.id} className="bg-surface p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground">{r.id}</div>
                  <h3 className="font-bold">{r.hospital}</h3>
                  <div className="text-xs font-mono text-muted-foreground">{r.requesterName || "Unknown"}</div>
                </div>
                <UrgencyBadge level={r.urgency} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <BloodTag group={r.bloodGroup} />
                <span className="font-mono">{r.units}U</span>
                <span className="font-mono">· {r.location} ({r.constituency})</span>
              </div>
              <a
                href={r.requesterPhone ? `tel:${r.requesterPhone}` : undefined}
                onClick={(e) => {
                  if (!r.requesterPhone) {
                    e.preventDefault();
                    toast.error("Requester phone number unavailable");
                    return;
                  }
                  toast.success(`Calling requester for ${r.id}`);
                }}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-foreground text-background py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-primary transition-colors"
              >
                <Phone className="size-3.5" />
                Respond / Call
              </a>
              <a
                href={
                  whatsappLink(
                    r.requesterPhone,
                    `Hi, I saw your ${r.urgency} request (${r.id}) for ${r.units}U ${r.bloodGroup}. I can help.`,
                  ) ?? undefined
                }
                onClick={(e) => {
                  if (!r.requesterPhone) {
                    e.preventDefault();
                    toast.error("Requester phone number unavailable");
                  }
                }}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setReportTarget({ role: "hospital", id: r.requesterPhone ?? r.requesterEmail ?? r.hospital })}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 border border-border py-2 font-mono text-[10px] tracking-widest uppercase font-bold hover:bg-muted transition-colors"
              >
                Report
              </button>
            </div>
          ))}
          {nearby.length === 0 && (
            <div className="bg-surface p-5 text-sm text-muted-foreground sm:col-span-2">
              No nearby emergency requests found in your area.
            </div>
          )}
        </div>
      </div>

      {editorOpen && user?.phone && (
        <ProfileEditor
          phone={user.phone ?? ""}
          name={me.name}
          bloodGroup={me.bloodGroup as BloodGroup}
          district={me.city as District}
          constituency={me.constituency}
          onClose={() => setEditorOpen(false)}
          onSaved={(nextProfile) => {
            setProfile(nextProfile);
            setAvailable(nextProfile.me.available);
            if (nextProfile.user) saveSessionUser(nextProfile.user);
            setEditorOpen(false);
          }}
        />
      )}

      {reportTarget && (
        <ReportDialog
          targetRole={reportTarget.role}
          targetPhoneOrEmail={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" /> <span className="font-mono text-[10px] tracking-widest uppercase">{label}</span>
      </span>
      <span>{children}</span>
    </div>
  );
}

function ProfileEditor({
  phone,
  name,
  bloodGroup,
  district,
  constituency,
  onClose,
  onSaved,
}: {
  phone: string;
  name: string;
  bloodGroup: BloodGroup;
  district: District;
  constituency: string;
  onClose: () => void;
  onSaved: (profile: Awaited<ReturnType<typeof getDonorProfileByPhone>>) => void;
}) {
  const [form, setForm] = useState({ name, bloodGroup, district, constituency });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateDonorProfile({ data: { phone, ...form } });
      const nextProfile = await getDonorProfileByPhone({ data: { phone } });
      onSaved(nextProfile);
      toast.success("Profile updated in MongoDB");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-md border border-border bg-surface hud-shadow">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-primary">
              // MongoDB Profile
            </div>
            <h2 className="text-lg font-bold">Update Donor Profile</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <label>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Full Name
            </div>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            />
          </label>
          <label>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Blood Group
            </div>
            <select
              value={form.bloodGroup}
              onChange={(event) => setForm({ ...form, bloodGroup: event.target.value as BloodGroup })}
              className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            >
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              District
            </div>
            <select
              value={form.district}
              onChange={(event) => {
                const district = event.target.value as District;
                setForm({ ...form, district, constituency: DISTRICT_CONSTITUENCIES[district][0] });
              }}
              className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            >
              {TAMIL_NADU_DISTRICTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Constituency
            </div>
            <select
              value={form.constituency}
              onChange={(event) => setForm({ ...form, constituency: event.target.value })}
              className="w-full border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-primary"
            >
              {DISTRICT_CONSTITUENCIES[form.district].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button onClick={onClose} className="border border-border px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-primary px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
