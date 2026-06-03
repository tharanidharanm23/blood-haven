import type { BloodGroup, District, Role } from "@/lib/mock-data";

export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  role: Role;
  district: District;
  constituency: string;
  bloodGroup?: BloodGroup;
  phone?: string;
  address?: string;
  initials: string;
};

const SESSION_KEY = "blood-haven-user";

export function saveSessionUser(user: SessionUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSessionUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
