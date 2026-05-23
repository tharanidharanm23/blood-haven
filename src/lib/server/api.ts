import { createServerFn } from "@tanstack/react-start";
import bcrypt from "bcryptjs";
import { type SessionUser } from "../session";
import { z } from "zod";
import { getDb, readCollection, seedDatabase } from "@/lib/server/db";
import type {
  BloodGroup,
  BloodRequest,
  DonationHistoryItem,
  Donor,
  InventoryItem,
  Notification,
  Role,
  Urgency,
  District,
} from "@/lib/mock-data";
import type { Report } from "@/lib/reports";
import { TAMIL_NADU_DISTRICTS } from "@/lib/mock-data";

const bloodGroupSchema = z.enum(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]);
const urgencySchema = z.enum(["Normal", "Urgent", "Critical"]);
const roleSchema = z.enum(["donor", "hospital", "admin"]);
const districtSchema = z.enum(TAMIL_NADU_DISTRICTS as [District, ...District[]]);

type UserDoc = {
  name: string;
  email?: string;
  passwordHash: string;
  role: Role;
  bloodGroup?: BloodGroup;
  district: District;
  constituency: string;
  phone?: string;
  address?: string;
  approved?: boolean;
  verified?: boolean;
  createdAt: string;
};

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
function assertAdmin(email: string) {
  if (email !== ADMIN_EMAIL) {
    throw new Error("Admin access denied");
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function isNearby(
  me: { district: District; constituency: string },
  other: { location?: District; city?: District; district?: District; constituency?: string },
) {
  const otherDistrict = other.location || other.city || other.district;
  const otherConstituency = other.constituency;

  if (me.district === otherDistrict) {
    if (me.constituency === otherConstituency) return "Constituency";
    return "District";
  }
  return "Far";
}

export const getShellData = createServerFn({ method: "GET" }).handler(async () => {
  const notifications = await readCollection<Notification>("notifications");
  return { notifications };
});

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  const activeDonorPhones = (await db.collection<UserDoc>("users").find({ role: "donor" }, { projection: { phone: 1 } }).toArray()).map(u => u.phone).filter(Boolean);
  
  const [donorsRaw, requests, inventory, monthlyRequests, bloodDistribution] = await Promise.all([
    db.collection<Donor>("donors").find({}, { projection: { _id: 0 } }).toArray() as Promise<Donor[]>,
    db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
    db.collection<InventoryItem>("inventory").find({}, { projection: { _id: 0 } }).toArray() as Promise<InventoryItem[]>,
    db.collection<{ month: string; requests: number }>("monthlyRequests").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<{ name: string; value: number }>("bloodDistribution").find({}, { projection: { _id: 0 } }).toArray(),
  ]);

  const donors = donorsRaw.filter(d => activeDonorPhones.includes(d.phone));
  return JSON.parse(JSON.stringify({ donors, requests, inventory, monthlyRequests, bloodDistribution }));
});

export const getAdminData = createServerFn({ method: "GET" }).handler(async () => {
  await seedDatabase();
  const db = await getDb();
  const [donors, requests, inventory, monthlyRequests, bloodDistribution, users, reports] = await Promise.all([
    db.collection<Donor>("donors").find({}, { projection: { _id: 0 } }).toArray() as Promise<Donor[]>,
    db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
    db.collection<InventoryItem>("inventory").find({}, { projection: { _id: 0 } }).toArray() as Promise<InventoryItem[]>,
    db.collection<{ month: string; requests: number }>("monthlyRequests")
      .find({}, { projection: { _id: 0 } })
      .toArray() as Promise<{ month: string; requests: number }[]>,
    db.collection<{ name: string; value: number }>("bloodDistribution")
      .find({}, { projection: { _id: 0 } })
      .toArray() as Promise<{ name: string; value: number }[]>,
    db
      .collection<UserDoc>("users")
      .find({}, { projection: { _id: 0, passwordHash: 0 } })
      .toArray() as Promise<UserDoc[]>,
    db.collection<Report>("reports").find({}, { projection: { _id: 0 } }).toArray() as Promise<Report[]>,
  ]);

  return { donors, requests, inventory, monthlyRequests, bloodDistribution, users, reports };
});

export const createReport = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      reporterRole: roleSchema,
      reporterPhoneOrEmail: z.string().min(3),
      targetRole: z.enum(["donor", "hospital"]),
      targetPhoneOrEmail: z.string().min(3),
      description: z.string().min(10).max(500),
    }),
  )
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const id = `R-${Date.now()}`;
    const report: Report = {
      id,
      reporterRole: data.reporterRole as Role,
      reporterPhone:
        data.reporterRole === "donor" || data.reporterRole === "hospital"
          ? normalizePhone(data.reporterPhoneOrEmail)
          : undefined,
      reporterEmail: data.reporterPhoneOrEmail.includes("@") ? data.reporterPhoneOrEmail : undefined,
      targetRole: data.targetRole,
      targetPhoneOrEmail: data.targetPhoneOrEmail,
      description: data.description,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    await db.collection<Report>("reports").insertOne(report);
    return { ok: true, reportId: id };
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminEmail: z.string().email(), reportId: z.string(), status: z.enum(["open", "resolved"]) }))
  .handler(async ({ data }) => {
    assertAdmin(data.adminEmail);
    await seedDatabase();
    const db = await getDb();
    await db.collection<Report>("reports").updateOne({ id: data.reportId }, { $set: { status: data.status } });
    return { ok: true };
  });

export const adminSetUserApproval = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminEmail: z.string().email(),
      phoneOrEmail: z.string().min(3),
      approved: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminEmail);
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phoneOrEmail);
    const filter = phone.length >= 10 ? { phone } : { email: data.phoneOrEmail };
    await db.collection<UserDoc>("users").updateOne(filter, { $set: { approved: data.approved } });
    return { ok: true };
  });

export const adminVerifyHospital = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminEmail: z.string().email(),
      phoneOrEmail: z.string().min(3),
      verified: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminEmail);
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phoneOrEmail);
    const filter = phone.length >= 10 ? { phone } : { email: data.phoneOrEmail };
    const user = await db.collection<UserDoc>("users").findOne(filter);
    if (!user) throw new Error("Hospital not found");
    if (user.role !== "hospital") throw new Error("User is not a hospital");
    await Promise.all([
      db.collection<UserDoc>("users").updateOne(filter, { $set: { verified: data.verified } }),
      user.email ? db.collection("hospitals").updateOne({ email: user.email }, { $set: { verified: data.verified } }) : Promise.resolve()
    ]);
    return { ok: true };
  });

export const adminRemoveUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminEmail: z.string().email(),
      phoneOrEmail: z.string().min(3),
    }),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.adminEmail);
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phoneOrEmail);
    const filter = phone.length >= 10 ? { phone } : { email: data.phoneOrEmail };
    const user = await db.collection<UserDoc>("users").findOne(filter);
    await Promise.all([
      db.collection<UserDoc>("users").deleteOne(filter),
      phone ? db.collection<Donor>("donors").deleteMany({ phone }) : Promise.resolve(),
      user?.email ? db.collection("hospitals").deleteMany({ email: user.email }) : Promise.resolve(),
      phone ? db.collection<BloodRequest>("requests").deleteMany({ requesterPhone: phone }) : Promise.resolve(),
      user?.email ? db.collection<BloodRequest>("requests").deleteMany({ requesterEmail: user.email }) : Promise.resolve(),
    ]);
    return { ok: true };
  });

export const adminRemoveRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminEmail: z.string().email(), requestId: z.string() }))
  .handler(async ({ data }) => {
    assertAdmin(data.adminEmail);
    await seedDatabase();
    const db = await getDb();
    await Promise.all([
      db.collection<BloodRequest>("requests").deleteOne({ id: data.requestId }),
      db.collection<Notification>("notifications").deleteMany({ id: `N-${data.requestId}` }),
    ]);
    return { ok: true };
  });

export const getDonorsData = createServerFn({ method: "GET" }).handler(async () => {
  await seedDatabase();
  const db = await getDb();
  // Fetch active donor phones to ensure we don't show deleted users
  const users = await db.collection<UserDoc>("users").find({ role: "donor" }, { projection: { phone: 1 } }).toArray();
  const activePhones = users.map(u => u.phone).filter(Boolean);

  const [donors, requests] = await Promise.all([
    db.collection<Donor>("donors").find({ phone: { $in: activePhones } }, { projection: { _id: 0 } }).toArray() as Promise<Donor[]>,
    db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
  ]);

  return { donors, requests };
});

export const getInventoryData = createServerFn({ method: "GET" }).handler(async () => {
  const inventory = await readCollection<InventoryItem>("inventory");
  return { inventory };
});

export const getHospitalData = createServerFn({ method: "GET" }).handler(async () => {
  await seedDatabase();
  const db = await getDb();
  // Fetch active donor phones to ensure we don't show deleted users
  const activeUserPhones = (await db.collection<UserDoc>("users").find({ role: "donor" }, { projection: { phone: 1 } }).toArray()).map(u => u.phone).filter(Boolean);

  const [donorsRaw, requests, inventory, notifications] = await Promise.all([
    db.collection<Donor>("donors").find({}, { projection: { _id: 0 } }).toArray() as Promise<Donor[]>,
    db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
    db.collection<InventoryItem>("inventory").find({}, { projection: { _id: 0 } }).toArray() as Promise<InventoryItem[]>,
    db.collection<Notification>("notifications").find({}, { projection: { _id: 0 } }).toArray() as Promise<Notification[]>,
  ]);

  const donors = donorsRaw.filter(d => activeUserPhones.includes(d.phone));

  return JSON.parse(JSON.stringify({ donors, requests, inventory, notifications }));
});

export const getDonorProfileData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().optional() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    
    // Find the specific donor by phone if provided, otherwise a placeholder
    const me = data.phone 
      ? await db.collection<Donor>("donors").findOne({ phone: data.phone }, { projection: { _id: 0 } })
      : await db.collection<Donor>("donors").findOne({}, { projection: { _id: 0 } });

    if (!me) return { me: null, history: [], nearby: [], nearbyDonors: [], user: null };

    const activePhones = (await db.collection<UserDoc>("users").find({ role: "donor" }, { projection: { phone: 1 } }).toArray()).map(u => u.phone).filter(Boolean);

    const [donorsRaw, requests, history] = await Promise.all([
      db.collection<Donor>("donors").find({ phone: { $in: activePhones } }, { projection: { _id: 0 } }).toArray() as Promise<Donor[]>,
      db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
      db.collection<DonationHistoryItem>("donationHistory").find({ donorId: me.id }, { projection: { _id: 0 } }).toArray() as Promise<DonationHistoryItem[]>,
    ]);

    const nearbyDonors = donorsRaw
      .filter((d) => d.id !== me.id && d.phone !== me.phone)
      .map((d) => {
        const sameConstituency = d.constituency === me.constituency;
        const sameDistrict = d.city === me.city;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return { ...d, matchLevel };
      })
      .filter((d) => d.matchLevel <= 2)
      .sort((a, b) => a.matchLevel - b.matchLevel)
      .slice(0, 6);
  const nearby = requests
    .filter((r) => r.requesterPhone !== me.phone)
    .map((r) => {
      const sameConstituency = r.constituency === me.constituency;
      const sameDistrict = r.location === me.city;
      const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
      return { ...r, matchLevel };
    })
    .filter((r) => r.matchLevel <= 2)
    .filter((r) => r.bloodGroup === me.bloodGroup || r.urgency === "Critical")
    .sort((a, b) => a.matchLevel - b.matchLevel)
    .slice(0, 4);

  return JSON.parse(JSON.stringify({
    me,
    user: null as SessionUser | null,
    history: history.filter((item) => item.donorId === (me as any).id),
    nearby,
    nearbyDonors,
  }));
});

export const getDonorProfileByPhone = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().min(10) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phone);
    const phoneWithPrefix = `+91${phone}`;
    const phoneFilter = { phone: { $in: [phone, phoneWithPrefix] } };
    const user = await db.collection<UserDoc>("users").findOne(phoneFilter);
    const donor = await db.collection<Donor>("donors").findOne(phoneFilter, { projection: { _id: 0 } }) as Donor | null;

    const [requests, history] = await Promise.all([
      db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as Promise<BloodRequest[]>,
      db.collection<DonationHistoryItem>("donationHistory").find({}, { projection: { _id: 0 } }).toArray() as Promise<DonationHistoryItem[]>,
    ]);

    const me = donor ?? ((await db.collection<Donor>("donors").findOne({}, { projection: { _id: 0 } })) as Donor);

    if (!me) {
      throw new Error("No donor profile found");
    }

    const nearby = requests
      .filter((r) => r.requesterPhone !== phone && normalizePhone(r.requesterPhone ?? "") !== phone)
      .map((r) => {
        const sameConstituency = r.constituency === me.constituency;
        const sameDistrict = r.location === me.city;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return { ...r, matchLevel };
      })
      .filter((r) => r.matchLevel <= 2)
      .filter((r) => r.bloodGroup === me.bloodGroup || r.urgency === "Critical")
      .sort((a, b) => a.matchLevel - b.matchLevel)
      .slice(0, 4);
    const nearbyDonors = (
      await db.collection<Donor>("donors").find({}, { projection: { _id: 0 } }).toArray() as Donor[]
    )
      .filter((d) => d.id !== me.id && d.phone !== me.phone)
      .map((d) => {
        const sameConstituency = d.constituency === me.constituency;
        const sameDistrict = d.city === me.city;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return { ...d, matchLevel };
      })
      .filter((d) => d.matchLevel <= 2)
      .sort((a, b) => a.matchLevel - b.matchLevel)
      .slice(0, 10);

    return {
      me,
      user: user
        ? {
            name: user.name,
          email: user.email ?? "",
            role: user.role,
            district: user.district,
            constituency: user.constituency,
            bloodGroup: user.bloodGroup,
            phone: user.phone,
            address: user.address,
            initials: initials(user.name),
          }
        : null,
      history: history.filter((item) => item.donorId === me.id),
      nearby,
      nearbyDonors,
    };
  });

export const updateDonorAvailability = createServerFn({ method: "POST" })
  .inputValidator(z.object({ donorId: z.string(), available: z.boolean() }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    await db.collection<Donor>("donors").updateOne(
      { id: data.donorId },
      { $set: { available: data.available } },
    );
    return { ok: true };
  });

export const updateDonorProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      phone: z.string().min(10),
      name: z.string().min(2),
      bloodGroup: bloodGroupSchema,
      district: districtSchema,
      constituency: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phone);

    await Promise.all([
      db.collection<UserDoc>("users").updateOne(
        { phone },
        {
          $set: {
            name: data.name,
            bloodGroup: data.bloodGroup as BloodGroup,
            district: data.district as District,
            constituency: data.constituency,
          },
        },
      ),
      db.collection<Donor>("donors").updateOne(
        { phone },
        {
          $set: {
            name: data.name,
            bloodGroup: data.bloodGroup as BloodGroup,
            city: data.district as District,
            constituency: data.constituency,
          },
        },
      ),
    ]);

    return { ok: true };
  });

export const addInventoryUnits = createServerFn({ method: "POST" })
  .inputValidator(z.object({ bloodGroup: bloodGroupSchema, units: z.number().int().min(1), expiry: z.string() }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    await db.collection<InventoryItem>("inventory").updateOne(
      { bloodGroup: data.bloodGroup },
      {
        $inc: { units: data.units },
        $set: { expiry: data.expiry },
        $setOnInsert: { capacity: 120, bloodGroup: data.bloodGroup as BloodGroup },
      },
      { upsert: true },
    );

    const inventory = await db
      .collection<InventoryItem>("inventory")
      .find({}, { projection: { _id: 0 } })
      .toArray() as InventoryItem[];

    return { inventory };
  });

export const createBloodRequest = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      urgency: urgencySchema,
      bloodGroup: bloodGroupSchema,
      units: z.number().int().min(1),
      location: districtSchema,
      constituency: z.string().min(2),
      requesterEmail: z.string().email().optional(),
      requesterPhone: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const requester = data.requesterEmail
      ? await db.collection<UserDoc>("users").findOne({ email: data.requesterEmail })
      : null;
    const request: BloodRequest = {
      id: `REQ-${Math.floor(Math.random() * 9000) + 1000}`,
      hospital:
        requester?.role === "hospital"
          ? requester.name
          : requester?.name
            ? `${requester.name} Request`
            : "Registered Tamil Nadu Hospital",
      bloodGroup: data.bloodGroup as BloodGroup,
      units: data.units,
      urgency: data.urgency as Urgency,
      location: data.location as District,
      constituency: data.constituency,
      requesterEmail: data.requesterEmail,
      requesterPhone: data.requesterPhone ? normalizePhone(data.requesterPhone) : requester?.phone,
      requesterName: requester?.name || "Unknown Requester",
      postedMinutesAgo: 0,
      status: "Matching",
    };

    await db.collection<BloodRequest>("requests").insertOne(request);
    await db.collection<Notification>("notifications").insertOne({
      id: `N-${request.id}`,
      type: "request",
      title: `${request.urgency} Request`,
      body: `${request.hospital} needs ${request.units}U ${request.bloodGroup} in ${request.location}.`,
      createdAt: new Date().toISOString(),
      read: false,
    });
    return { request };
  });

export const deleteBloodRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ requestId: z.string(), requesterPhone: z.string().min(10) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.requesterPhone);
    const req = await db
      .collection<BloodRequest>("requests")
      .findOne({ id: data.requestId }, { projection: { _id: 0 } });
    if (!req) return { ok: true };
    if (!req.requesterPhone || normalizePhone(req.requesterPhone) !== phone) {
      throw new Error("Not authorized to delete this request");
    }
    await Promise.all([
      db.collection<BloodRequest>("requests").deleteOne({ id: data.requestId }),
      db.collection<Notification>("notifications").deleteMany({ id: `N-${data.requestId}` }),
    ]);
    return { ok: true };
  });

export const signupUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(2),
      email: z.union([z.string().email(), z.literal("")]).optional(),
      password: z.string().min(6),
      role: roleSchema,
      bloodGroup: bloodGroupSchema.optional(),
      district: districtSchema,
      constituency: z.string().min(2),
      address: z.string().min(5),
      phone: z.string().min(10),
    }),
  )
  .handler(async ({ data }) => {
    if (data.role === "admin") {
      throw new Error("Admin signup is disabled. Use designated admin credentials.");
    }
    if (data.role === "hospital" && (!data.email || !data.email.includes("@"))) {
      throw new Error("Email is required for hospital registration.");
    }
    // Normalize empty email to undefined for donors
    if (!data.email || data.email.trim() === "") data.email = undefined;
    await seedDatabase();
    const db = await getDb();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const phone = normalizePhone(data.phone);
    const user: UserDoc = {
      name: data.name,
      email: data.email || undefined,
      passwordHash,
      role: data.role as Role,
      bloodGroup: data.bloodGroup as BloodGroup | undefined,
      district: data.district as District,
      constituency: data.constituency,
      phone,
      address: data.address,
      approved: data.role === "hospital" ? false : true,
      verified: data.role === "hospital" ? false : undefined,
      createdAt: new Date().toISOString(),
    };

    await db.collection<UserDoc>("users").updateOne(
      { phone },
      {
        $set: user,
      },
      { upsert: true },
    );

    if (data.role === "donor") {
      const donor: Donor = {
        id: `D-${Date.now().toString().slice(-6)}`,
        email: data.email,
        name: data.name,
        bloodGroup: (data.bloodGroup ?? "O+") as BloodGroup,
        phone,
        available: true,
        lastDonation: "Not recorded",
        city: data.district as District,
        constituency: data.constituency,
        lifetimeDonations: 0,
      };

      await db.collection<Donor>("donors").updateOne(
        { phone },
        {
          $set: {
            email: donor.email,
            name: donor.name,
            bloodGroup: donor.bloodGroup,
            phone: donor.phone,
            city: donor.city,
            constituency: donor.constituency,
            available: donor.available,
          },
          $setOnInsert: {
            id: donor.id,
            lastDonation: donor.lastDonation,
            lifetimeDonations: donor.lifetimeDonations,
          },
        },
        { upsert: true },
      );
    } else if (data.role === "hospital") {
      const hospitalDoc = {
        id: `H-${Date.now().toString().slice(-6)}`,
        name: data.name,
        email: data.email,
        phone,
        district: data.district as District,
        constituency: data.constituency,
        address: data.address,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      
      await db.collection("hospitals").updateOne(
        { email: data.email },
        {
          $set: {
            name: hospitalDoc.name,
            phone: hospitalDoc.phone,
            district: hospitalDoc.district,
            constituency: hospitalDoc.constituency,
            address: hospitalDoc.address,
          },
          $setOnInsert: {
            id: hospitalDoc.id,
            verified: hospitalDoc.verified,
            createdAt: hospitalDoc.createdAt,
          }
        },
        { upsert: true }
      );
    }

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        constituency: user.constituency,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        address: user.address,
        initials: initials(user.name),
      },
    };
  });

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      phoneOrEmail: z.string().min(3),
      password: z.string().min(6),
      role: roleSchema,
    }),
  )
  .handler(async ({ data }) => {
    if (data.role === "admin") {
      if (data.phoneOrEmail !== ADMIN_EMAIL || data.password !== ADMIN_PASSWORD) {
        throw new Error("Only the authorized admin can access this dashboard.");
      }
      return {
        user: {
          name: "System Admin",
          email: ADMIN_EMAIL,
          role: "admin" as Role,
          district: "Chennai" as District,
          bloodGroup: undefined,
          initials: "SA",
        },
      };
    }

    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phoneOrEmail);
    const phoneWithPrefix = `+91${phone}`;
    const user =
      data.role === "donor"
        ? await db.collection<UserDoc>("users").findOne({
            $or: [
              { phone: { $in: [phone, phoneWithPrefix] } },
              ...(data.phoneOrEmail.includes("@") ? [{ email: { $regex: new RegExp(`^${data.phoneOrEmail.trim()}$`, "i") } }] : []),
            ],
          })
        : await db.collection<UserDoc>("users").findOne({
            email: { $regex: new RegExp(`^${data.phoneOrEmail.trim()}$`, "i") },
          });

    if (!user) {
      throw new Error("Account not found. Please register first.");
    }

    if (!user.passwordHash) {
      throw new Error("Account is incomplete. Please re-register.");
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    if (user.role !== data.role) {
      throw new Error(`This account is registered as ${user.role}`);
    }

    if (user.role === "hospital" && user.approved === false) {
      throw new Error("Hospital account is pending admin approval");
    }

    await db.collection("loginEvents").insertOne({
      phone: user.phone,
      role: data.role,
      loggedInAt: new Date().toISOString(),
    });

    return {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        constituency: user.constituency,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        address: user.address,
        initials: initials(user.name),
      },
    };
  });

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().min(10) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phone);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await db.collection("otpChallenges").deleteMany({ phone });
    await db.collection("otpChallenges").insertOne({ phone, code, expiresAt, createdAt: new Date().toISOString() });
    
    // Simulate sending OTP via SMS/WhatsApp
    console.log(`[SMS/WhatsApp] Sending OTP ${code} to ${phone}`);
    
    return { ok: true, devCode: code };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().min(10), code: z.string().min(4) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.phone);
    const entry = await db.collection<{ phone: string; code: string; expiresAt: string }>("otpChallenges").findOne({ phone });
    if (!entry) throw new Error("OTP not found. Request a new OTP.");
    if (new Date(entry.expiresAt).getTime() < Date.now()) throw new Error("OTP expired. Request a new OTP.");
    if (entry.code !== data.code) throw new Error("Invalid OTP.");
    await db.collection("otpChallenges").deleteMany({ phone });
    return { ok: true };
  });

export const certifyDonation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      donorId: z.string(),
      hospitalEmail: z.string().email(),
      hospitalName: z.string().min(2),
      location: z.string(),
      constituency: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const donor = await db.collection<Donor>("donors").findOne({ id: data.donorId }, { projection: { _id: 0 } });
    if (!donor) {
      throw new Error("Donor not found");
    }
    const nextCount = (donor.lifetimeDonations ?? 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    await Promise.all([
      db.collection<Donor>("donors").updateOne(
        { id: data.donorId },
        { $set: { lifetimeDonations: nextCount, lastDonation: today } },
      ),
      db.collection<DonationHistoryItem>("donationHistory").insertOne({
        donorId: data.donorId,
        date: today,
        location: data.location as District,
        constituency: data.constituency,
        units: 1,
        hospitalName: data.hospitalName,
      }),
      db.collection<Notification>("notifications").insertOne({
        id: `N-CERT-${Date.now()}`,
        type: "system",
        title: "Donor Certified",
        body: `${donor.name} was certified by ${data.hospitalName}. Lifetime donations: ${nextCount}.`,
        createdAt: new Date().toISOString(),
        read: false,
      }),
    ]);
    return { ok: true, lifetimeDonations: nextCount };
  });

export const markRequestFulfilled = createServerFn({ method: "POST" })
  .inputValidator(z.object({ requestId: z.string(), requesterPhone: z.string().min(10) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const phone = normalizePhone(data.requesterPhone);
    const req = await db.collection<BloodRequest>("requests").findOne({ id: data.requestId }, { projection: { _id: 0 } });
    if (!req) return { ok: true };
    if (!req.requesterPhone || normalizePhone(req.requesterPhone) !== phone) {
      throw new Error("Not authorized to update this request");
    }
    await db.collection<BloodRequest>("requests").updateOne({ id: data.requestId }, { $set: { status: "Fulfilled" } });
    return { ok: true };
  });

/* ── Nearby Blood Requests (for hospitals) ── */
/* ── Nearby Blood Requests (for hospitals) ── */
export const getNearbyRequestsForHospital = createServerFn({ method: "POST" })
  .inputValidator(z.object({ district: districtSchema, constituency: z.string().optional(), phone: z.string().optional(), email: z.string().optional() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    
    const requests = await db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as BloodRequest[];
    const myPhone = data.phone ? normalizePhone(data.phone) : undefined;
    const filtered = requests
      .filter((r) => r.status !== "Fulfilled")
      // Exclude own requests
      .filter((r) => {
        if (myPhone && r.requesterPhone && normalizePhone(r.requesterPhone) === myPhone) return false;
        if (data.email && r.requesterEmail === data.email) return false;
        return true;
      })
      .map((r) => {
        const sameConstituency = r.constituency === data.constituency;
        const sameDistrict = r.location === data.district;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return { ...r, matchLevel };
      })
      .filter((r) => r.matchLevel <= 2)
      .sort((a, b) => a.matchLevel - b.matchLevel);

    return JSON.parse(JSON.stringify({ requests: filtered }));
  });

/* ── Search donors for certification ── */
export const searchDonorsForCertify = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const q = data.query.trim();
    const phone = normalizePhone(q);
    const phoneWithPrefix = `+91${phone}`;
    const donors = await db.collection<Donor>("donors").find(
      { $or: [{ phone: { $in: [phone, phoneWithPrefix] } }, { name: { $regex: q, $options: "i" } }, { id: q }] },
      { projection: { _id: 0 } },
    ).limit(10).toArray() as Donor[];
    return { donors };
  });

/* ── Hospital Chain: list hospitals ── */
export const getHospitalChainData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ district: districtSchema, constituency: z.string().optional(), email: z.string().optional() }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const hospitals = await db.collection("hospitals").find({}, { projection: { _id: 0, passwordHash: 0 } }).toArray() as any[];
    const inventory = await readCollection<InventoryItem>("inventory");
    const mapped = hospitals
      .filter((h) => !data.email || h.email !== data.email)
      .map((h) => {
        const sameConstituency = h.constituency === data.constituency;
        const sameDistrict = h.district === data.district;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return {
          name: h.name,
          phone: h.phone,
          email: h.email,
          district: h.district,
          constituency: h.constituency,
          address: h.address,
          verified: h.verified,
          matchLevel,
        };
      });
    return {
      hospitals: mapped
        .filter((h) => h.matchLevel <= 2)
        .sort((a, b) => a.matchLevel - b.matchLevel),
      inventory,
    };
  });

/* ── Hospital Chain: transfer blood ── */
export const transferBloodBetweenHospitals = createServerFn({ method: "POST" })
  .inputValidator(z.object({ fromHospitalEmail: z.string(), toHospitalName: z.string(), bloodGroup: bloodGroupSchema, units: z.number().int().min(1) }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    // Deduct from inventory
    const item = await db.collection<InventoryItem>("inventory").findOne({ bloodGroup: data.bloodGroup as BloodGroup });
    if (!item || item.units < data.units) throw new Error(`Not enough ${data.bloodGroup} units in inventory`);
    await db.collection<InventoryItem>("inventory").updateOne({ bloodGroup: data.bloodGroup as BloodGroup }, { $inc: { units: -data.units } });
    // Log transfer
    await db.collection("bloodTransfers").insertOne({
      id: `TF-${Date.now()}`,
      fromEmail: data.fromHospitalEmail,
      toName: data.toHospitalName,
      bloodGroup: data.bloodGroup,
      units: data.units,
      createdAt: new Date().toISOString(),
    });
    const inventory = await readCollection<InventoryItem>("inventory");
    return { ok: true, inventory };
  });

/* ── Nearby hospitals for donors ── */
export const getNearbyHospitals = createServerFn({ method: "POST" })
  .inputValidator(z.object({ district: districtSchema, constituency: z.string().optional(), email: z.string().optional() }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const hospitals = await db.collection("hospitals").find({}, { projection: { _id: 0, passwordHash: 0 } }).toArray() as any[];
    const mapped = hospitals
      .filter((h) => !data.email || h.email !== data.email)
      .map((h) => {
        const sameConstituency = h.constituency === data.constituency;
        const sameDistrict = h.district === data.district;
        const matchLevel = sameConstituency ? 1 : sameDistrict ? 2 : 3;
        return {
          name: h.name,
          phone: h.phone,
          email: h.email,
          district: h.district,
          constituency: h.constituency,
          address: h.address,
          verified: h.verified,
          matchLevel,
        };
      });
    return {
      hospitals: mapped
        .filter((h) => h.matchLevel <= 2)
        .sort((a, b) => a.matchLevel - b.matchLevel),
    };
  });

/* ── Get My Requests ── */
export const getMyRequests = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().optional(), email: z.string().optional() }))
  .handler(async ({ data }) => {
    await seedDatabase();
    const db = await getDb();
    const myPhone = data.phone ? normalizePhone(data.phone) : undefined;
    const phoneWithPrefix = myPhone ? `+91${myPhone}` : undefined;
    const requests = await db.collection<BloodRequest>("requests").find({}, { projection: { _id: 0 } }).toArray() as BloodRequest[];
    const mine = requests.filter((r) => {
      if (myPhone && r.requesterPhone) {
        const rPhone = normalizePhone(r.requesterPhone);
        if (rPhone === myPhone || r.requesterPhone === phoneWithPrefix) return true;
      }
      if (data.email && r.requesterEmail === data.email) return true;
      return false;
    });
    return JSON.parse(JSON.stringify({ requests: mine }));
  });
