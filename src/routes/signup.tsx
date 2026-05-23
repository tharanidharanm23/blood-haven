import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthLayout, RoleTabs, Field } from "./login";
import { PhoneInput } from "@/components/PhoneInput";
import {
  BLOOD_GROUPS,
  TAMIL_NADU_DISTRICTS,
  DISTRICT_CONSTITUENCIES,
  type BloodGroup,
  type District,
  type Role,
} from "@/lib/mock-data";
import { signupUser } from "@/lib/client-api";
import { saveSessionUser } from "@/lib/session";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Enlist — Donor Land" },
      { name: "description", content: "Create a Donor Land account in 60 seconds." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("donor");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    bloodGroup: "O+" as BloodGroup,
    district: "Chennai" as District,
    constituency: "Kolathur",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form, v: string) => {
    if (k === "district") {
      const constituencies = DISTRICT_CONSTITUENCIES[v as District];
      setForm({ ...form, district: v as District, constituency: constituencies[0] });
    } else {
      setForm({ ...form, [k]: v });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Required";
    if (role === "hospital" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email required for hospitals";
    if (form.password.length < 6) errs.password = "Min 6 characters";
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) errs.phone = "Valid phone required";
    if (form.address.trim().length < 5) errs.address = "Address required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const result = await signupUser({ data: { ...form, role, email: form.email || undefined } });
      saveSessionUser(result.user);
      toast.success("Account created. Welcome to the network.");
      navigate({
        to:
          result.user.role === "donor"
            ? "/donor"
            : result.user.role === "hospital"
              ? "/hospital"
              : "/dashboard",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Enlist Operative" subtitle="Join the network in under a minute.">
      <RoleTabs value={role} onChange={setRole} roles={["donor", "hospital"]} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-6">
        <Field label="Full Name" error={errors.name}>
          <input className="hud-input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Arun Kumar" />
        </Field>
        <Field label={role === "hospital" ? "Email (required)" : "Email (optional)"} error={errors.email}>
          <input type="email" className="hud-input" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder={role === "hospital" ? "hospital@gmail.com" : "operative@donorland.io"} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input type="password" className="hud-input" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <PhoneInput value={form.phone} onChange={(v) => update("phone", v)} />
        </Field>
        <Field label="Address" error={errors.address}>
          <input className="hud-input" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="12, Main Road, Chennai" />
        </Field>

        {role === "donor" && (
          <Field label="Blood Group">
            <select className="hud-input" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        )}
        <Field label="District">
          <select className="hud-input" value={form.district} onChange={(e) => update("district", e.target.value)}>
            {TAMIL_NADU_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Constituency">
          <select className="hud-input" value={form.constituency} onChange={(e) => update("constituency", e.target.value)}>
            {DISTRICT_CONSTITUENCIES[form.district].map((constituency) => (
              <option key={constituency} value={constituency}>
                {constituency}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground py-3 font-mono text-xs tracking-widest uppercase font-bold hover:bg-foreground transition-colors disabled:opacity-50">
          {loading ? "Provisioning..." : "Activate Terminal"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already enlisted?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
