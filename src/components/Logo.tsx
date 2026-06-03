// Donor Land brand mark — minimal HUD-style square + drop indicator.
import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="size-4 bg-primary flex items-center justify-center group-hover:rotate-90 transition-transform">
        <div className="size-1.5 bg-primary-foreground" />
      </div>
      <span className="font-mono text-sm tracking-[0.2em] font-bold uppercase">BLOOD_HAVEN</span>
    </Link>
  );
}
