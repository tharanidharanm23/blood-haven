// Public site navigation used on landing + auth pages.
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const links = [
  { to: "/request" as const, label: "Request" },
  { to: "/donors" as const, label: "Donors" },
  { to: "/dashboard" as const, label: "Dashboard" },
];

export function SiteNav() {
  return (
    <nav className="w-full border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <Logo />
        <div className="hidden md:flex items-center gap-6 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-block px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold border border-border hover:bg-muted transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold bg-foreground text-background hover:bg-primary transition-colors"
          >
            Enlist
          </Link>
        </div>
      </div>
    </nav>
  );
}
