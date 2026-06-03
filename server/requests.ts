import type { AuthPayload } from "./auth.js";
import type { BloodRequest } from "../src/lib/mock-data.js";

export function ownsRequest(req: BloodRequest, auth: AuthPayload): boolean {
  if (req.requesterUserId && req.requesterUserId === auth.sub) return true;
  if (auth.email && req.requesterEmail?.toLowerCase() === auth.email.toLowerCase()) return true;
  if (auth.phone && req.requesterPhone === auth.phone) return true;
  return false;
}
