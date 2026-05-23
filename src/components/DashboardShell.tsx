// Shared dashboard layout: sidebar nav + header bar with notifications.
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Droplets,
  Users,
  Siren,
  MapPin,
  Boxes,
  Bell,
  Menu,
  X,
  LogOut,
  Hospital,
  Award,
  Link2,
  Building2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import type { Notification, Role } from "@/lib/mock-data";
import { clearSessionUser, getSessionUser, type SessionUser } from "@/lib/session";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
};

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  donor: [
    { to: "/donor", label: "Donor Profile", icon: Droplets },
    { to: "/request", label: "Blood Request", icon: Siren },
    { to: "/search", label: "Nearby Donors", icon: Users },
    { to: "/help-hospital", label: "Help Hospital", icon: Hospital },
    { to: "/hospitals", label: "Nearby Hospitals", icon: Building2 },
  ],
  hospital: [
    { to: "/hospital", label: "Hospital Dashboard", icon: LayoutDashboard },
    { to: "/request", label: "Create Request", icon: Siren },
    { to: "/donors", label: "Matched Donors", icon: Users },
    { to: "/inventory", label: "Blood Inventory", icon: Boxes },
    { to: "/nearby-requests", label: "Requests Around Us", icon: MapPin },
    { to: "/certify", label: "Certify Donors", icon: Award },
    { to: "/hospital-chain", label: "Hospital Chain", icon: Link2 },
  ],
  admin: [
    { to: "/dashboard", label: "Admin Overview", icon: LayoutDashboard },
    { to: "/donors", label: "Manage Users", icon: Users },
    { to: "/request", label: "Monitor Requests", icon: Siren },
    { to: "/inventory", label: "Inventory Control", icon: Boxes },
    { to: "/search", label: "Nearby Search", icon: MapPin },
  ],
};

const ALLOWED_BY_ROLE: Record<Role, string[]> = {
  donor: ["/donor", "/request", "/search", "/help-hospital", "/hospitals"],
  hospital: ["/hospital", "/request", "/donors", "/inventory", "/nearby-requests", "/certify", "/hospital-chain"],
  admin: ["/dashboard", "/request", "/donors", "/inventory", "/search"],
};

const HOME_BY_ROLE: Record<Role, "/donor" | "/hospital" | "/dashboard"> = {
  donor: "/donor",
  hospital: "/hospital",
  admin: "/dashboard",
};

export function DashboardShell({ notifications }: { notifications: Notification[] }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setSessionUser(getSessionUser());
    setMounted(true);
  }, []);

  const navItems = useMemo(() => {
    if (!mounted || !sessionUser?.role) return [];
    return NAV_BY_ROLE[sessionUser.role];
  }, [mounted, sessionUser?.role]);

  useEffect(() => {
    if (!mounted) return;
    
    if (!sessionUser?.role) {
      navigate({ to: "/login" });
      return;
    }
    const allowed = ALLOWED_BY_ROLE[sessionUser.role];
    if (!allowed.includes(path)) {
      navigate({ to: HOME_BY_ROLE[sessionUser.role] });
    }
  }, [mounted, navigate, path, sessionUser]);

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-dvh w-64 bg-surface border-r border-border transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <Logo />
          <button
            className="lg:hidden p-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground px-3 py-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const active = path === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-2 ${
                  active
                    ? "bg-muted border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 border border-border"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground hidden sm:block">
              Tamil Nadu Grid
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 border border-border hover:bg-muted transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center font-mono">
                  {unread}
                </span>
              )}
            </button>
            {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} notifications={notifications} />}
            <button
              onClick={() => {
                clearSessionUser();
                setSessionUser(null);
                toast.success("Logged out");
                navigate({ to: "/login" });
              }}
              className="p-2 border border-border hover:bg-muted transition-colors"
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </button>
            <div className="size-8 bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs font-bold">
              {sessionUser?.initials ?? "TN"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}

function NotifPanel({ onClose, notifications }: { onClose: () => void; notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-12 w-80 sm:w-96 bg-surface border border-border hud-shadow z-40 animate-scale-in origin-top-right">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <span className="font-mono text-[10px] tracking-widest uppercase font-bold">
            Notification Stream
          </span>
          <button
            onClick={() => setItems(items.map((n) => ({ ...n, read: true })))}
            className="font-mono text-[10px] uppercase text-primary hover:underline"
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-4 border-b border-border last:border-0 ${
                !n.read ? "bg-primary-dim/30" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-sm font-bold">{n.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "now"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
