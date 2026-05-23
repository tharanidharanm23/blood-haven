import type { Role } from "@/lib/mock-data";

export type ReportTargetRole = "donor" | "hospital";

export type Report = {
  id: string;
  reporterRole: Role;
  reporterPhone?: string;
  reporterEmail?: string;
  targetRole: ReportTargetRole;
  targetPhoneOrEmail: string;
  description: string;
  status: "open" | "resolved";
  createdAt: string;
};

