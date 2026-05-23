import {
  donors as seedDonors,
  requests as seedRequests,
  inventory as seedInventory,
  monthlyRequests,
  bloodDistribution,
  donationHistory,
  type BloodGroup,
  type BloodRequest,
  type Donor,
  type District,
  type InventoryItem,
  type Notification,
  type Role,
  type Urgency,
} from "@/lib/mock-data";
import type { Report } from "@/lib/reports";
import { getSessionUser, type SessionUser } from "@/lib/session";

type UserRecord = SessionUser & {
  password?: string;
  approved?: boolean;
  verified?: boolean;
};

type HospitalEntry = {
  name: string;
  phone?: string;
  email?: string;
  district: string;
  constituency?: string;
  address?: string;
  verified?: boolean;
  matchLevel: number;
};

type RequestWithMatch = BloodRequest & { matchLevel?: number };

type DonorProfile = {
  me: Donor;
  history: typeof donationHistory;
  nearby: BloodRequest[];
  nearbyDonors: Donor[];
  user: SessionUser | null;
};

const USERS_KEY = "blood-haven-users";
const DONORS_KEY = "blood-haven-donors";
const REQUESTS_KEY = "blood-haven-requests";
const INVENTORY_KEY = "blood-haven-inventory";
const REPORTS_KEY = "blood-haven-reports";

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const readStore = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return deepClone(fallback);
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return deepClone(fallback);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return deepClone(fallback);
  }
};

const writeStore = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const initialsForName = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

const seedUsers = (): UserRecord[] => {
  const donorUsers: UserRecord[] = seedDonors.map((donor) => ({
    name: donor.name,
    phone: donor.phone,
    email: donor.email,
    role: "donor",
    district: donor.city,
    constituency: donor.constituency,
    bloodGroup: donor.bloodGroup,
    initials: initialsForName(donor.name),
    approved: true,
  }));

  const hospitals: UserRecord[] = [
    {
      name: "Chennai Government General Hospital",
      phone: "+919500320101",
      email: "cgh@donorland.io",
      role: "hospital",
      district: "Chennai",
      constituency: "Mylapore",
      address: "EVR Salai, Chennai",
      initials: "CG",
      approved: true,
      verified: true,
      password: "hospital123",
    },
    {
      name: "Coimbatore Medical College Hospital",
      phone: "+919500320102",
      email: "cmch@donorland.io",
      role: "hospital",
      district: "Coimbatore",
      constituency: "Coimbatore South",
      address: "Avinashi Rd, Coimbatore",
      initials: "CM",
      approved: true,
      verified: false,
      password: "hospital123",
    },
  ];

  const admin: UserRecord = {
    name: "Network Admin",
    email: "admin@gmail.com",
    role: "admin",
    district: "Chennai",
    constituency: "Kolathur",
    initials: "NA",
    approved: true,
    password: "admin123",
  };

  return [...donorUsers, ...hospitals, admin];
};

const readUsers = () => readStore<UserRecord[]>(USERS_KEY, seedUsers());
const readDonors = () => readStore<Donor[]>(DONORS_KEY, seedDonors);
const readRequests = () => readStore<BloodRequest[]>(REQUESTS_KEY, seedRequests);
const readInventory = () => readStore<InventoryItem[]>(INVENTORY_KEY, seedInventory);
const readReports = () => readStore<Report[]>(REPORTS_KEY, []);

const toSessionUser = (user: UserRecord): SessionUser => ({
  name: user.name,
  email: user.email,
  role: user.role,
  district: user.district,
  constituency: user.constituency,
  bloodGroup: user.bloodGroup,
  phone: user.phone,
  address: user.address,
  initials: user.initials || initialsForName(user.name),
});

const nextRequestId = (requests: BloodRequest[]) => {
  let id = "REQ-" + Math.floor(1000 + Math.random() * 9000).toString();
  while (requests.some((r) => r.id === id)) {
    id = "REQ-" + Math.floor(1000 + Math.random() * 9000).toString();
  }
  return id;
};

export async function getDonorsData() {
  return { donors: readDonors(), requests: readRequests() };
}

export async function getNearbyHospitals({
  data,
}: {
  data: { district: District; constituency?: string; email?: string };
}) {
  const users = readUsers().filter((u) => u.role === "hospital" && u.email !== data.email);
  const hospitals: HospitalEntry[] = users.map((u) => {
    const sameConstituency = u.constituency === data.constituency;
    const sameDistrict = u.district === data.district;
    const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
    return {
      name: u.name,
      phone: u.phone,
      email: u.email,
      district: u.district,
      constituency: u.constituency,
      address: u.address,
      verified: u.verified,
      matchLevel,
    };
  });
  return { hospitals };
}

export async function getNearbyRequestsForHospital({
  data,
}: {
  data: { district: District; constituency?: string; phone?: string; email?: string };
}) {
  const requests = readRequests().map((r) => {
    const matchLevel = r.constituency === data.constituency ? 1 : r.location === data.district ? 2 : 3;
    return { ...r, matchLevel } as RequestWithMatch;
  });
  return { requests };
}

export async function getHospitalData() {
  return {
    inventory: readInventory(),
    donors: readDonors(),
    requests: readRequests(),
    notifications: [] as Notification[],
  };
}

export async function getMyRequests({ data }: { data: { phone?: string; email?: string } }) {
  const requests = readRequests().filter(
    (r) => (data.phone && r.requesterPhone === data.phone) || (data.email && r.requesterEmail === data.email),
  );
  return { requests };
}

export async function deleteBloodRequest({ data }: { data: { requestId: string } }) {
  const requests = readRequests().filter((r) => r.id !== data.requestId);
  writeStore(REQUESTS_KEY, requests);
  return { requests };
}

export async function markRequestFulfilled({ data }: { data: { requestId: string } }) {
  const requests = readRequests().map((r) => (r.id === data.requestId ? { ...r, status: "Fulfilled" } : r));
  writeStore(REQUESTS_KEY, requests);
  return { requests };
}

export async function getHospitalChainData({
  data,
}: {
  data: { district?: District; constituency?: string; email?: string };
}) {
  const users = readUsers().filter((u) => u.role === "hospital" && u.email !== data.email);
  const hospitals = users
    .filter((u) => (data.district ? u.district === data.district : true))
    .map((u) => ({
      name: u.name,
      phone: u.phone,
      email: u.email,
      district: u.district,
      constituency: u.constituency,
      address: u.address,
      verified: u.verified,
    }));

  return { hospitals, inventory: readInventory() };
}

export async function transferBloodBetweenHospitals({
  data,
}: {
  data: { fromHospitalEmail: string; toHospitalName: string; bloodGroup: BloodGroup; units: number };
}) {
  const inventory = readInventory().map((item) => {
    if (item.bloodGroup !== data.bloodGroup) return item;
    return { ...item, units: Math.max(0, item.units - data.units) };
  });
  writeStore(INVENTORY_KEY, inventory);
  return { inventory };
}

export async function addInventoryUnits({
  data,
}: {
  data: { bloodGroup: BloodGroup; units: number; expiry: string };
}) {
  const inventory = readInventory().map((item) => {
    if (item.bloodGroup !== data.bloodGroup) return item;
    return { ...item, units: item.units + data.units, expiry: data.expiry };
  });
  writeStore(INVENTORY_KEY, inventory);
  return { inventory };
}

export async function getInventoryData() {
  return { inventory: readInventory() };
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
  const reports = readReports();
  const report: Report = {
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    reporterRole: data.reporterRole,
    reporterPhone: data.reporterPhoneOrEmail?.includes("@") ? undefined : data.reporterPhoneOrEmail,
    reporterEmail: data.reporterPhoneOrEmail?.includes("@") ? data.reporterPhoneOrEmail : undefined,
    targetRole: data.targetRole,
    targetPhoneOrEmail: data.targetPhoneOrEmail,
    description: data.description,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  reports.unshift(report);
  writeStore(REPORTS_KEY, reports);
  return { report };
}

export async function getAdminData() {
  return {
    users: readUsers(),
    donors: readDonors(),
    requests: readRequests(),
    reports: readReports(),
    inventory: readInventory(),
    monthlyRequests,
    bloodDistribution,
  };
}

export async function adminSetUserApproval({ data }: { data: { phoneOrEmail: string; approved: boolean } }) {
  const users = readUsers().map((u) => {
    if (u.phone === data.phoneOrEmail || u.email === data.phoneOrEmail) {
      return { ...u, approved: data.approved };
    }
    return u;
  });
  writeStore(USERS_KEY, users);
  return { users };
}

export async function adminVerifyHospital({ data }: { data: { phoneOrEmail: string; verified: boolean } }) {
  const users = readUsers().map((u) => {
    if (u.phone === data.phoneOrEmail || u.email === data.phoneOrEmail) {
      return { ...u, verified: data.verified };
    }
    return u;
  });
  writeStore(USERS_KEY, users);
  return { users };
}

export async function adminRemoveUser({ data }: { data: { phoneOrEmail: string } }) {
  const users = readUsers().filter((u) => u.phone !== data.phoneOrEmail && u.email !== data.phoneOrEmail);
  writeStore(USERS_KEY, users);
  const donors = readDonors().filter((d) => d.phone !== data.phoneOrEmail && d.email !== data.phoneOrEmail);
  writeStore(DONORS_KEY, donors);
  return { users, donors };
}

export async function adminRemoveRequest({ data }: { data: { requestId: string } }) {
  const requests = readRequests().filter((r) => r.id !== data.requestId);
  writeStore(REQUESTS_KEY, requests);
  return { requests };
}

export async function adminResolveReport({ data }: { data: { reportId: string; status: "open" | "resolved" } }) {
  const reports = readReports().map((r) => (r.id === data.reportId ? { ...r, status: data.status } : r));
  writeStore(REPORTS_KEY, reports);
  return { reports };
}

export async function getDonorProfileData({ data }: { data: { phone?: string } }) {
  return getDonorProfileByPhone({ data: { phone: data.phone ?? "" } });
}

export async function getDonorProfileByPhone({ data }: { data: { phone: string } }): Promise<DonorProfile> {
  const donors = readDonors();
  const session = getSessionUser();
  let me = donors.find((d) => d.phone === data.phone) ?? donors[0];

  if (!me && session?.phone) {
    me = {
      id: `D-${Math.floor(1000 + Math.random() * 9000)}`,
      name: session.name,
      phone: session.phone,
      email: session.email,
      bloodGroup: session.bloodGroup ?? "O+",
      available: true,
      lastDonation: new Date().toISOString().slice(0, 10),
      city: session.district,
      constituency: session.constituency,
      lifetimeDonations: 0,
    };
    donors.push(me);
    writeStore(DONORS_KEY, donors);
  }

  const history = donationHistory.filter((h) => h.donorId === me?.id);
  const nearby = readRequests().filter((r) => r.location === me?.city);
  const nearbyDonors = donors.filter((d) => d.city === me?.city && d.id !== me?.id);
  const userRecord = readUsers().find((u) => u.phone === data.phone) ?? null;

  return {
    me: me ?? donors[0],
    history,
    nearby,
    nearbyDonors,
    user: userRecord ? toSessionUser(userRecord) : session,
  };
}

export async function updateDonorProfile({
  data,
}: {
  data: { phone: string; name: string; bloodGroup: BloodGroup; district: District; constituency: string };
}) {
  const donors = readDonors().map((d) => {
    if (d.phone === data.phone) {
      return {
        ...d,
        name: data.name,
        bloodGroup: data.bloodGroup,
        city: data.district,
        constituency: data.constituency,
      };
    }
    return d;
  });
  writeStore(DONORS_KEY, donors);
  const users = readUsers().map((u) => {
    if (u.phone === data.phone) {
      return {
        ...u,
        name: data.name,
        bloodGroup: data.bloodGroup,
        district: data.district,
        constituency: data.constituency,
        initials: initialsForName(data.name),
      };
    }
    return u;
  });
  writeStore(USERS_KEY, users);
  return { donors };
}

export async function updateDonorAvailability({ data }: { data: { donorId: string; available: boolean } }) {
  const donors = readDonors().map((d) => (d.id === data.donorId ? { ...d, available: data.available } : d));
  writeStore(DONORS_KEY, donors);
  return { donors };
}

export async function searchDonorsForCertify({ data }: { data: { query: string } }) {
  const q = data.query.toLowerCase();
  const donors = readDonors().filter((d) =>
    d.name.toLowerCase().includes(q) ||
    d.id.toLowerCase().includes(q) ||
    (d.phone?.toLowerCase().includes(q) ?? false),
  );
  return { donors };
}

export async function certifyDonation({
  data,
}: {
  data: { donorId: string; hospitalEmail: string; hospitalName?: string; location: District };
}) {
  let updatedDonor: Donor | null = null;
  const donors = readDonors().map((d) => {
    if (d.id === data.donorId) {
      const lifetimeDonations = (d.lifetimeDonations ?? 0) + 1;
      updatedDonor = { ...d, lifetimeDonations, lastDonation: new Date().toISOString().slice(0, 10) };
      return updatedDonor;
    }
    return d;
  });
  writeStore(DONORS_KEY, donors);
  return { lifetimeDonations: updatedDonor?.lifetimeDonations ?? 0 };
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
  const requests = readRequests();
  const session = getSessionUser();
  const request: BloodRequest = {
    id: nextRequestId(requests),
    hospital: session?.name ?? "Unknown Hospital",
    requesterEmail: data.requesterEmail,
    requesterPhone: data.requesterPhone,
    requesterName: session?.name,
    bloodGroup: data.bloodGroup,
    units: data.units,
    urgency: data.urgency,
    location: data.location,
    constituency: data.constituency,
    postedMinutesAgo: 0,
    status: "Matching",
  };
  requests.unshift(request);
  writeStore(REQUESTS_KEY, requests);
  return { request };
}

export async function loginUser({
  data,
}: {
  data: { phoneOrEmail: string; password: string; role: Role };
}) {
  const users = readUsers();
  const user = users.find(
    (u) =>
      u.role === data.role &&
      (u.email?.toLowerCase() === data.phoneOrEmail.toLowerCase() || u.phone === data.phoneOrEmail),
  );

  if (!user || (user.password && user.password !== data.password)) {
    throw new Error("Invalid credentials");
  }

  return { user: toSessionUser(user) };
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
  const users = readUsers();
  const exists = users.some(
    (u) => u.phone === data.phone || (data.email && u.email?.toLowerCase() === data.email.toLowerCase()),
  );
  if (exists) throw new Error("User already exists");

  const user: UserRecord = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: data.role,
    district: data.district,
    constituency: data.constituency,
    bloodGroup: data.bloodGroup,
    initials: initialsForName(data.name),
    approved: true,
    verified: data.role === "hospital" ? false : undefined,
    password: data.password,
  };

  users.unshift(user);
  writeStore(USERS_KEY, users);

  if (data.role === "donor") {
    const donors = readDonors();
    donors.unshift({
      id: `D-${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      bloodGroup: data.bloodGroup ?? "O+",
      available: true,
      lastDonation: new Date().toISOString().slice(0, 10),
      city: data.district,
      constituency: data.constituency,
      lifetimeDonations: 0,
    });
    writeStore(DONORS_KEY, donors);
  }

  return { user: toSessionUser(user) };
}
