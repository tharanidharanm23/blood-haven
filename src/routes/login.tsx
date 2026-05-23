// Login page with role tabs and basic validation.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { PhoneInput } from "@/components/PhoneInput";
import type { Role } from "@/lib/mock-data";
import { loginUser } from "@/lib/server/api";
import { saveSessionUser } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Donor Land" },
      { name: "description", content: "Sign in to your Donor Land terminal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("donor");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (role === "admin" || role === "hospital") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) e.identifier = "Enter a valid Gmail";
    } else if (!/^\+?[0-9]{10,15}$/.test(identifier.trim())) {
      e.identifier = "Enter a valid mobile number";
    }
    if (password.length < 6) e.password = "Min 6 characters";
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const result = await loginUser({ data: { phoneOrEmail: identifier, password, role } });
      saveSessionUser(result.user);
      toast.success(`Authenticated as ${result.user.role}`);
      navigate({
        to:
          result.user.role === "donor"
            ? "/donor"
            : result.user.role === "hospital"
              ? "/hospital"
              : "/dashboard",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Terminal Login" subtitle="Authenticate to access your dashboard.">
      <RoleTabs value={role} onChange={setRole} />
      <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-6">
        {role === "donor" ? (
          <Field label="Mobile Number" error={errors.identifier}>
            <PhoneInput value={identifier} onChange={setIdentifier} placeholder="10-digit number" />
          </Field>
        ) : (
          <Field label="Gmail" error={errors.identifier}>
            <input
              type="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="hud-input"
              placeholder={role === "admin" ? "admin@gmail.com" : "hospital@gmail.com"}
            />
          </Field>
        )}
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hud-input"
            placeholder="••••••••"
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground py-3 font-mono text-xs tracking-widest uppercase font-bold hover:bg-foreground transition-colors disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Initiate Session"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No credentials?{" "}
        <Link to="/signup" className="text-primary font-bold hover:underline">
          Enlist now
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Left side mission panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 hud-grid opacity-10" />
        <Logo className="relative" />
        <div className="relative">
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-3">
            // Mission Brief
          </div>
          <h2 className="text-4xl font-bold tracking-tight uppercase leading-tight mb-4">
            Saving lives,
            <br />
            one drop at a time.
          </h2>
          <p className="text-background/60 max-w-md text-sm leading-relaxed">
            Connect with Tamil Nadu's 38-district blood network. Real-time matching, emergency
            dispatch, and inventory telemetry — all from a single terminal.
          </p>
        </div>
        <div className="relative font-mono text-[10px] tracking-widest uppercase text-background/40">
          ● secure connection · tls 1.3 · tamil nadu node
        </div>
      </div>
      {/* Right form */}
      <div className="flex flex-col justify-center p-6 sm:p-12 bg-background">
        <div className="lg:hidden mb-8">
          <Logo />
        </div>
        <div className="max-w-md w-full mx-auto">
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-2">
            // Authentication
          </div>
          <h1 className="text-3xl font-bold tracking-tight uppercase mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
      <style>{`
        .hud-input {
          width: 100%;
          padding: 0.75rem 0.875rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          font-family: var(--font-mono);
          font-size: 0.875rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color 0.15s;
        }
        .hud-input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

export function RoleTabs({
  value,
  onChange,
  roles = ["donor", "hospital", "admin"],
}: {
  value: Role;
  onChange: (r: Role) => void;
  roles?: Role[];
}) {
  const allRoles: { id: Role; label: string }[] = [
    { id: "donor", label: "Donor" },
    { id: "hospital", label: "Hospital" },
    { id: "admin", label: "Admin" },
  ];
  const roleList = allRoles.filter((role) => roles.includes(role.id));
  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
        Operative Class
      </div>
      <div className={`grid gap-px bg-border border border-border ${roleList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {roleList.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={`py-3 font-mono text-xs uppercase tracking-widest font-bold transition-colors ${
              value === r.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface hover:bg-muted text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2 flex justify-between">
        <span>{label}</span>
        {error && <span className="text-primary normal-case tracking-normal">{error}</span>}
      </div>
      {children}
    </label>
  );
}
