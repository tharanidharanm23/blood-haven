import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Radar, Siren, Heart, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { BLOOD_GROUPS, TAMIL_NADU_DISTRICTS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Donor Land — Saving Lives, One Drop at a Time" },
      {
        name: "description",
        content:
          "Become a donor or request blood through Donor Land's Tamil Nadu blood network. Smart matching, emergency alerts, live availability.",
      },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: Radar,
    label: "Smart Matching",
    body: "Algorithm cross-references blood type, Tamil Nadu district, eligibility window, and last donation in milliseconds.",
  },
  {
    icon: Siren,
    label: "Emergency Alerts",
    body: "Critical requests broadcast to compatible donors across the selected district instantly with one-tap response.",
  },
  {
    icon: Activity,
    label: "Live Availability",
    body: "Real-time inventory telemetry across connected Tamil Nadu facilities, refreshed every 200ms.",
  },
];

const steps = [
  {
    n: "01",
    title: "Register",
    body: "Create a Donor, Hospital, or Admin profile with one of Tamil Nadu's 38 districts.",
  },
  {
    n: "02",
    title: "Match",
    body: "Get matched to verified requests within your district and eligibility.",
  },
  {
    n: "03",
    title: "Save Lives",
    body: "Confirm, donate, and track your impact across the network.",
  },
];

function HomePage() {
  const networkStats = [
    { k: "District Coverage", v: `${TAMIL_NADU_DISTRICTS.length}` },
    { k: "Blood Groups", v: `${BLOOD_GROUPS.length}` },
    { k: "Role Dashboards", v: "3" },
    { k: "Location Range", v: "5-20km" },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hud-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20">
          <div className="flex flex-col items-start max-w-4xl">
            <div className="flex items-center gap-3 mb-8 border border-primary/30 bg-primary-dim/40 px-3 py-1.5">
              <span className="size-2 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] text-primary font-bold uppercase">
                Location-Based Matching Enabled
              </span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-balance mb-6 uppercase">
              Saving Lives,
              <br />
              <span className="text-muted-foreground">One Drop at a Time.</span>
            </h1>
            <p className="text-lg sm:text-xl font-medium text-muted-foreground max-w-[55ch] leading-snug mb-10 text-pretty">
              Donor Land is the mission-control network for Tamil Nadu blood banks, hospitals, and
              donors — 38-district coverage, smart matching, and emergency dispatch in a single HUD.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-4 font-mono text-xs tracking-widest uppercase font-bold hover:bg-foreground transition-colors hud-shadow"
              >
                Become a Donor
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/request"
                className="inline-flex items-center gap-2 bg-surface text-foreground px-6 py-4 font-mono text-xs tracking-widest uppercase font-bold border border-border hover:bg-muted transition-colors"
              >
                Request Blood
              </Link>
            </div>
          </div>

          {/* Network snapshot */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
            {networkStats.map((s) => (
              <div key={s.k} className="bg-surface p-4 sm:p-5">
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  {s.k}
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-3">
            // System Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-12 uppercase">
            Built for the critical moment.
          </h2>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {features.map((f) => (
              <div key={f.label} className="bg-surface p-8 hover:bg-muted transition-colors">
                <f.icon className="size-6 text-primary mb-6" strokeWidth={1.5} />
                <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                  Module
                </div>
                <h3 className="text-xl font-bold mb-3">{f.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="font-mono text-[10px] tracking-widest uppercase text-primary mb-3">
            // Operational Sequence
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-12 uppercase">
            Three steps. Zero friction.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="hud-panel p-8">
                <div className="font-mono text-5xl font-bold text-primary mb-4">{s.n}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight uppercase mb-3">
              Join the network.
            </h2>
            <p className="text-background/70 max-w-xl">
              Every minute matters. Enlist today and become part of Tamil Nadu's real-time blood
              network.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 font-mono text-xs tracking-widest uppercase font-bold hover:bg-background hover:text-foreground transition-colors"
          >
            <Heart className="size-4" />
            Enlist Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-4 bg-primary" />
              <span className="font-mono text-sm tracking-[0.2em] font-bold uppercase">
                BLOOD_HAVEN
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Blood bank operations platform for Tamil Nadu with donor, hospital, and admin
              workflows.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
              Contact
            </div>
            <ul className="space-y-2 text-sm">
              <li>tharanidharanm23@gmail.com</li>
              <li>+91 9500324562</li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-4">
              Network
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/donors" className="hover:text-primary">
                  Donors
                </Link>
              </li>
              <li>
                <Link to="/inventory" className="hover:text-primary">
                  Inventory
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            <span>© 2026 Donor Land</span>
            <span>Location-aware blood network</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
