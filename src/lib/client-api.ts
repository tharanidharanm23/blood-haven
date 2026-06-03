import type {
  BloodGroup,
  BloodRequest,
  District,
  Donor,
  InventoryItem,
  Notification,
  Role,
  Urgency,
} from "@/lib/mock-data";
import type { Report } from "@/lib/reports";
import type { SessionUser } from "@/lib/session";
import { apiFetch } from "@/lib/api-fetch";

type DonorProfile = {
  me: Donor;
  history: { donorId: string; date: string; location: District; constituency: string; units: number }[];
  nearby: BloodRequest[];
  nearbyDonors: Donor[];
  user: SessionUser | null;
};

export async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const { user } = await apiFetch<{ user: SessionUser }>("/api/auth/me");
    return user;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function getDonorsData() {
  return apiFetch<{ donors: Donor[]; requests: BloodRequest[] }>("/api/donors");
}

export async function getNearbyHospitals({
  data,
}: {
  data: { district: District; constituency?: string; email?: string };
}) {
  const params = new URLSearchParams({
    district: data.district,
    ...(data.constituency ? { constituency: data.constituency } : {}),
    ...(data.email ? { email: data.email } : {}),
  });
  return apiFetch<{ hospitals: unknown[] }>(`/api/hospitals/nearby?${params}`);
}

export async function getNearbyRequestsForHospital({
  data,
}: {
  data: { district: District; constituency?: string };
}) {
  const params = new URLSearchParams({
    district: data.district,
    ...(data.constituency ? { constituency: data.constituency } : {}),
  });
  return apiFetch<{ requests: (BloodRequest & { matchLevel?: number })[] }>(
    `/api/hospitals/nearby-requests?${params}`,
  );
}

export async function getHospitalData() {
  return apiFetch<{
    inventory: InventoryItem[];
    donors: Donor[];
    requests: BloodRequest[];
    notifications: Notification[];
  }>("/api/hospital/dashboard");
}

export async function getMyRequests({
  data: _data,
}: {
  data: { phone?: string; email?: string };
}) {
  return apiFetch<{ requests: BloodRequest[] }>("/api/requests/mine");
}

export async function deleteBloodRequest({ data }: { data: { requestId: string } }) {
  return apiFetch<{ requests: BloodRequest[] }>(`/api/requests/${data.requestId}`, {
    method: "DELETE",
  });
}

export async function markRequestFulfilled({ data }: { data: { requestId: string } }) {
  return apiFetch<{ requests: BloodRequest[] }>(`/api/requests/${data.requestId}/fulfill`, {
    method: "PATCH",
  });
}

export async function getHospitalChainData({
  data,
}: {
  data: { district?: District; constituency?: string; email?: string };
}) {
  const params = new URLSearchParams();
  if (data.district) params.set("district", data.district);
  if (data.email) params.set("email", data.email);
  return apiFetch<{ hospitals: unknown[]; inventory: InventoryItem[] }>(
    `/api/hospital-chain?${params}`,
  );
}

export async function transferBloodBetweenHospitals({
  data,
}: {
  data: {
    fromHospitalEmail: string;
    toHospitalName: string;
    toHospitalEmail?: string;
    bloodGroup: BloodGroup;
    units: number;
  };
}) {
  return apiFetch<{ inventory: InventoryItem[] }>("/api/hospital-chain/transfer", {
    method: "POST",
    body: JSON.stringify({
      toHospitalName: data.toHospitalName,
      toHospitalEmail: data.toHospitalEmail,
      bloodGroup: data.bloodGroup,
      units: data.units,
    }),
  });
}

export async function addInventoryUnits({
  data,
}: {
  data: { bloodGroup: BloodGroup; units: number; expiry: string };
}) {
  return apiFetch<{ inventory: InventoryItem[] }>("/api/inventory/add", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getInventoryData() {
  return apiFetch<{ inventory: InventoryItem[] }>("/api/inventory");
}

export async function createReport({
  data,
}: {
  data: {
    reporterRole: Role;
    reporterPhoneOrEmail?: string;
    targetRole: "donor" | "hospital";
    targetPhoneOrEmail: string;
    description: string;
  };
}) {
  return apiFetch<{ report: Report }>("/api/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAdminData() {
  return apiFetch<{
    users: SessionUser[];
    donors: Donor[];
    requests: BloodRequest[];
    reports: Report[];
    inventory: InventoryItem[];
    monthlyRequests: { month: string; requests: number }[];
    bloodDistribution: { name: string; value: number }[];
  }>("/api/admin");
}

export async function adminSetUserApproval({
  data,
}: {
  data: { phoneOrEmail: string; approved: boolean };
}) {
  return apiFetch<{ users: SessionUser[] }>("/api/admin/users/approval", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function adminVerifyHospital({
  data,
}: {
  data: { phoneOrEmail: string; verified: boolean };
}) {
  return apiFetch<{ users: SessionUser[] }>("/api/admin/users/verify", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function adminRemoveUser({ data }: { data: { phoneOrEmail: string } }) {
  return apiFetch<{ users: SessionUser[]; donors: Donor[] }>("/api/admin/users", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

export async function adminRemoveRequest({ data }: { data: { requestId: string } }) {
  return apiFetch<{ requests: BloodRequest[] }>(`/api/admin/requests/${data.requestId}`, {
    method: "DELETE",
  });
}

export async function adminResolveReport({
  data,
}: {
  data: { reportId: string; status: "open" | "resolved" };
}) {
  return apiFetch<{ reports: Report[] }>(`/api/admin/reports/${data.reportId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: data.status }),
  });
}

export async function getDonorProfileData({ data: _data }: { data: { phone?: string } }) {
  return getDonorProfileByPhone({ data: { phone: "" } });
}

export async function getDonorProfileByPhone({
  data: _data,
}: {
  data: { phone: string };
}): Promise<DonorProfile> {
  return apiFetch<DonorProfile>("/api/donor/profile");
}

export async function updateDonorProfile({
  data,
}: {
  data: {
    phone: string;
    name: string;
    bloodGroup: BloodGroup;
    district: District;
    constituency: string;
  };
}) {
  return apiFetch<{ donors: Donor[] }>("/api/donor/profile", {
    method: "PATCH",
    body: JSON.stringify({
      name: data.name,
      bloodGroup: data.bloodGroup,
      district: data.district,
      constituency: data.constituency,
    }),
  });
}

export async function updateDonorAvailability({
  data,
}: {
  data: { donorId: string; available: boolean };
}) {
  return apiFetch<{ donors: Donor[] }>("/api/donor/availability", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function searchDonorsForCertify({ data }: { data: { query: string } }) {
  const params = new URLSearchParams({ q: data.query });
  return apiFetch<{ donors: Donor[] }>(`/api/donors/search?${params}`);
}

export async function certifyDonation({
  data,
}: {
  data: { donorId: string; hospitalEmail: string; hospitalName?: string; location: District };
}) {
  return apiFetch<{ lifetimeDonations: number }>("/api/donors/certify", {
    method: "POST",
    body: JSON.stringify({ donorId: data.donorId }),
  });
}

export async function createBloodRequest({
  data,
}: {
  data: {
    bloodGroup: BloodGroup;
    units: number;
    urgency: Urgency;
    location: District;
    constituency: string;
    requesterEmail?: string;
    requesterPhone?: string;
  };
}) {
  return apiFetch<{ request: BloodRequest }>("/api/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginUser({
  data,
}: {
  data: { phoneOrEmail: string; password: string; role: Role };
}) {
  return apiFetch<{ user: SessionUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function signupUser({
  data,
}: {
  data: {
    name: string;
    email?: string;
    password: string;
    phone: string;
    address: string;
    bloodGroup?: BloodGroup;
    district: District;
    constituency: string;
    role: Role;
  };
}) {
  return apiFetch<{ user: SessionUser }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
