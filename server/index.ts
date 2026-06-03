import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import {
  bloodDistribution,
  donationHistory,
  monthlyRequests,
  type BloodGroup,
  type BloodRequest,
  type District,
  type Role,
  type Urgency,
} from "../src/lib/mock-data.js";
import { getDb, toIdString } from "./db.js";
import {
  clearSessionCookie,
  requireAuth,
  requireRole,
  setSessionCookie,
  signToken,
  verifyToken,
  readToken,
} from "./auth.js";
import {
  addUnits,
  aggregateAdminInventory,
  getHospitalInventory,
  transferUnits,
  type HospitalInventoryDoc,
} from "./inventory.js";
import { findUserByEmail, findUserById, findUserByLogin, toPublicUser, type UserDoc } from "./users.js";
import { ownsRequest } from "./requests.js";

const PORT = Number(process.env.API_PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const initialsForName = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

function nextRequestId(requests: BloodRequest[]) {
  let id = "REQ-" + Math.floor(1000 + Math.random() * 9000).toString();
  while (requests.some((r) => r.id === id)) {
    id = "REQ-" + Math.floor(1000 + Math.random() * 9000).toString();
  }
  return id;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
  const db = await getDb();
  const user = await findUserById(db, payload.sub);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { phoneOrEmail, password, role } = req.body as {
    phoneOrEmail?: string;
    password?: string;
    role?: Role;
  };
  if (!phoneOrEmail || !password || !role) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }
  const db = await getDb();
  const user = await findUserByLogin(db, role, phoneOrEmail);
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.approved === false) {
    res.status(403).json({ error: "Account pending approval" });
    return;
  }
  const publicUser = toPublicUser(user);
  const token = signToken({
    sub: publicUser.id,
    role: publicUser.role,
    email: publicUser.email,
    phone: publicUser.phone,
  });
  setSessionCookie(res, token);
  res.json({ user: publicUser });
});

app.post("/api/auth/signup", async (req, res) => {
  const data = req.body as {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    bloodGroup?: BloodGroup;
    district?: District;
    constituency?: string;
    role?: Role;
  };
  if (!data.name || !data.password || !data.phone || !data.district || !data.constituency || !data.role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const db = await getDb();
  const exists = await db.collection("users").findOne({
    $or: [
      { phone: data.phone },
      ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
    ],
  });
  if (exists) {
    res.status(409).json({ error: "User already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const doc: UserDoc = {
    name: data.name,
    email: data.email?.toLowerCase(),
    phone: data.phone,
    address: data.address,
    role: data.role,
    district: data.district,
    constituency: data.constituency,
    bloodGroup: data.bloodGroup,
    initials: initialsForName(data.name),
    approved: true,
    verified: data.role === "hospital" ? false : undefined,
    passwordHash,
  };
  const inserted = await db.collection<UserDoc>("users").insertOne(doc);
  doc._id = inserted.insertedId;

  if (data.role === "donor") {
    await db.collection("donors").insertOne({
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
      userId: toIdString(inserted.insertedId),
    });
  }
  if (data.role === "hospital" && data.email) {
    await getHospitalInventory(db, data.email);
  }

  const publicUser = toPublicUser(doc);
  const token = signToken({
    sub: publicUser.id,
    role: publicUser.role,
    email: publicUser.email,
    phone: publicUser.phone,
  });
  setSessionCookie(res, token);
  res.json({ user: publicUser });
});

app.post("/api/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/donors", requireAuth, async (_req, res) => {
  const db = await getDb();
  const donors = await db.collection("donors").find().toArray();
  const requests = await db.collection<BloodRequest>("requests").find().toArray();
  res.json({ donors, requests });
});

app.get("/api/hospital/dashboard", requireAuth, requireRole("hospital"), async (req, res) => {
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  if (!user?.email) {
    res.status(400).json({ error: "Hospital email required" });
    return;
  }
  const inventory = await getHospitalInventory(db, user.email);
  const donors = await db.collection("donors").find().toArray();
  const requests = await db.collection<BloodRequest>("requests").find().toArray();
  res.json({ inventory, donors, requests, notifications: [] });
});

app.get("/api/requests/mine", requireAuth, async (req, res) => {
  const db = await getDb();
  const auth = req.auth!;
  const requests = await db
    .collection<BloodRequest>("requests")
    .find({
      $or: [
        { requesterUserId: auth.sub },
        ...(auth.email ? [{ requesterEmail: auth.email }] : []),
        ...(auth.phone ? [{ requesterPhone: auth.phone }] : []),
      ],
    })
    .toArray();
  res.json({ requests });
});

app.post("/api/requests", requireAuth, async (req, res) => {
  const data = req.body as {
    bloodGroup?: BloodGroup;
    units?: number;
    urgency?: Urgency;
    location?: District;
    constituency?: string;
  };
  if (!data.bloodGroup || !data.units || !data.urgency || !data.location || !data.constituency) {
    res.status(400).json({ error: "Missing request fields" });
    return;
  }
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  const existing = await db.collection<BloodRequest>("requests").find().toArray();
  const request: BloodRequest = {
    id: nextRequestId(existing),
    hospital: user?.name ?? "Unknown Hospital",
    requesterUserId: req.auth!.sub,
    requesterEmail: user?.email,
    requesterPhone: user?.phone,
    requesterName: user?.name,
    bloodGroup: data.bloodGroup,
    units: data.units,
    urgency: data.urgency,
    location: data.location,
    constituency: data.constituency,
    postedMinutesAgo: 0,
    status: "Matching",
  };
  await db.collection("requests").insertOne(request);
  res.json({ request });
});

app.delete("/api/requests/:requestId", requireAuth, async (req, res) => {
  const db = await getDb();
  const request = await db
    .collection<BloodRequest>("requests")
    .findOne({ id: req.params.requestId });
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const auth = req.auth!;
  const isOwner = ownsRequest(request, auth);
  const isAdmin = auth.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Not allowed to delete this request" });
    return;
  }
  await db.collection("requests").deleteOne({ id: req.params.requestId });
  const requests = await db.collection<BloodRequest>("requests").find().toArray();
  res.json({ requests });
});

app.patch("/api/requests/:requestId/fulfill", requireAuth, async (req, res) => {
  const db = await getDb();
  const request = await db
    .collection<BloodRequest>("requests")
    .findOne({ id: req.params.requestId });
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const auth = req.auth!;
  if (!ownsRequest(request, auth) && auth.role !== "admin") {
    res.status(403).json({ error: "Not allowed to update this request" });
    return;
  }
  await db
    .collection("requests")
    .updateOne({ id: req.params.requestId }, { $set: { status: "Fulfilled" } });
  const requests = await db.collection<BloodRequest>("requests").find().toArray();
  res.json({ requests });
});

app.get("/api/hospitals/nearby", requireAuth, async (req, res) => {
  const district = req.query.district as District;
  const constituency = req.query.constituency as string | undefined;
  const email = req.query.email as string | undefined;
  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({ role: "hospital", ...(email ? { email: { $ne: email.toLowerCase() } } : {}) })
    .toArray();
  const hospitals = users.map((u) => {
    const sameConstituency = u.constituency === constituency;
    const sameDistrict = u.district === district;
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
  res.json({ hospitals });
});

app.get("/api/hospitals/nearby-requests", requireAuth, async (req, res) => {
  const district = req.query.district as District;
  const constituency = req.query.constituency as string | undefined;
  const db = await getDb();
  const requests = await db.collection<BloodRequest>("requests").find().toArray();
  const withMatch = requests.map((r) => ({
    ...r,
    matchLevel: r.constituency === constituency ? 1 : r.location === district ? 2 : 3,
  }));
  res.json({ requests: withMatch });
});

app.get("/api/inventory", requireAuth, async (req, res) => {
  const db = await getDb();
  if (req.auth!.role === "admin") {
    const docs = await db.collection<HospitalInventoryDoc>("hospitalInventory").find().toArray();
    res.json({ inventory: aggregateAdminInventory(docs) });
    return;
  }
  const user = await findUserById(db, req.auth!.sub);
  if (req.auth!.role === "hospital" && user?.email) {
    res.json({ inventory: await getHospitalInventory(db, user.email) });
    return;
  }
  res.status(403).json({ error: "Forbidden" });
});

app.post("/api/inventory/add", requireAuth, requireRole("hospital"), async (req, res) => {
  const { bloodGroup, units, expiry } = req.body as {
    bloodGroup?: BloodGroup;
    units?: number;
    expiry?: string;
  };
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  if (!user?.email) {
    res.status(400).json({ error: "Hospital email required" });
    return;
  }
  const inventory = await addUnits(db, user.email, bloodGroup!, units!, expiry!);
  res.json({ inventory });
});

app.get("/api/hospital-chain", requireAuth, requireRole("hospital"), async (req, res) => {
  const district = req.query.district as District | undefined;
  const email = req.query.email as string | undefined;
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  const filter: Record<string, unknown> = { role: "hospital" };
  if (email) filter.email = { $ne: email.toLowerCase() };
  if (district) filter.district = district;
  const hospitals = await db.collection<UserDoc>("users").find(filter).toArray();
  const inventory = user?.email ? await getHospitalInventory(db, user.email) : [];
  res.json({
    hospitals: hospitals.map((u) => ({
      name: u.name,
      phone: u.phone,
      email: u.email,
      district: u.district,
      constituency: u.constituency,
      address: u.address,
      verified: u.verified,
    })),
    inventory,
  });
});

app.post("/api/hospital-chain/transfer", requireAuth, requireRole("hospital"), async (req, res) => {
  const { toHospitalEmail, toHospitalName, bloodGroup, units } = req.body as {
    toHospitalEmail?: string;
    toHospitalName?: string;
    bloodGroup?: BloodGroup;
    units?: number;
  };
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  if (!user?.email) {
    res.status(400).json({ error: "Hospital email required" });
    return;
  }
  let targetEmail = toHospitalEmail?.toLowerCase();
  if (!targetEmail && toHospitalName) {
    const target = await db.collection<UserDoc>("users").findOne({
      role: "hospital",
      name: toHospitalName,
    });
    targetEmail = target?.email?.toLowerCase();
  }
  if (!targetEmail) {
    res.status(400).json({ error: "Destination hospital not found" });
    return;
  }
  const { from } = await transferUnits(db, user.email, targetEmail, bloodGroup!, units!);
  res.json({ inventory: from });
});

app.get("/api/donor/profile", requireAuth, requireRole("donor"), async (req, res) => {
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  let me = await db.collection("donors").findOne({
    $or: [{ userId: req.auth!.sub }, { phone: user?.phone }],
  });
  if (!me && user) {
    me = {
      id: `D-${Math.floor(1000 + Math.random() * 9000)}`,
      name: user.name,
      phone: user.phone,
      email: user.email,
      bloodGroup: user.bloodGroup ?? "O+",
      available: true,
      lastDonation: new Date().toISOString().slice(0, 10),
      city: user.district,
      constituency: user.constituency,
      lifetimeDonations: 0,
      userId: req.auth!.sub,
    };
    await db.collection("donors").insertOne(me);
  }
  const history = donationHistory.filter((h) => h.donorId === me?.id);
  const nearby = await db
    .collection<BloodRequest>("requests")
    .find({ location: me?.city })
    .toArray();
  const nearbyDonors = await db
    .collection("donors")
    .find({ city: me?.city, id: { $ne: me?.id } })
    .toArray();
  res.json({
    me,
    history,
    nearby,
    nearbyDonors,
    user: user ? toPublicUser(user) : null,
  });
});

app.patch("/api/donor/profile", requireAuth, requireRole("donor"), async (req, res) => {
  const { name, bloodGroup, district, constituency } = req.body;
  const db = await getDb();
  const user = await findUserById(db, req.auth!.sub);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db.collection("users").updateOne(
    { _id: new ObjectId(req.auth!.sub) },
    {
      $set: {
        name,
        bloodGroup,
        district,
        constituency,
        initials: initialsForName(name),
      },
    },
  );
  await db.collection("donors").updateOne(
    { $or: [{ userId: req.auth!.sub }, { phone: user.phone }] },
    { $set: { name, bloodGroup, city: district, constituency } },
  );
  const donors = await db.collection("donors").find().toArray();
  res.json({ donors });
});

app.patch("/api/donor/availability", requireAuth, requireRole("donor"), async (req, res) => {
  const { donorId, available } = req.body as { donorId?: string; available?: boolean };
  const db = await getDb();
  await db.collection("donors").updateOne({ id: donorId }, { $set: { available } });
  const donors = await db.collection("donors").find().toArray();
  res.json({ donors });
});

app.get("/api/donors/search", requireAuth, requireRole("hospital"), async (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const db = await getDb();
  const donors = await db
    .collection("donors")
    .find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { id: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    })
    .toArray();
  res.json({ donors });
});

app.post("/api/donors/certify", requireAuth, requireRole("hospital"), async (req, res) => {
  const { donorId } = req.body as { donorId?: string };
  const db = await getDb();
  const donor = await db.collection("donors").findOne({ id: donorId });
  if (!donor) {
    res.status(404).json({ error: "Donor not found" });
    return;
  }
  const lifetimeDonations = (donor.lifetimeDonations ?? 0) + 1;
  await db.collection("donors").updateOne(
    { id: donorId },
    {
      $set: {
        lifetimeDonations,
        lastDonation: new Date().toISOString().slice(0, 10),
      },
    },
  );
  res.json({ lifetimeDonations });
});

app.post("/api/reports", requireAuth, async (req, res) => {
  const data = req.body;
  const db = await getDb();
  const report = {
    id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
    reporterRole: data.reporterRole,
    reporterPhone: data.reporterPhoneOrEmail?.includes("@")
      ? undefined
      : data.reporterPhoneOrEmail,
    reporterEmail: data.reporterPhoneOrEmail?.includes("@")
      ? data.reporterPhoneOrEmail
      : undefined,
    targetRole: data.targetRole,
    targetPhoneOrEmail: data.targetPhoneOrEmail,
    description: data.description,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };
  await db.collection("reports").insertOne(report);
  res.json({ report });
});

app.get("/api/admin", requireAuth, requireRole("admin"), async (_req, res) => {
  const db = await getDb();
  const users = await db.collection<UserDoc>("users").find().toArray();
  const invDocs = await db.collection<HospitalInventoryDoc>("hospitalInventory").find().toArray();
  res.json({
    users: users.map(toPublicUser),
    donors: await db.collection("donors").find().toArray(),
    requests: await db.collection("requests").find().toArray(),
    reports: await db.collection("reports").find().toArray(),
    inventory: aggregateAdminInventory(invDocs),
    monthlyRequests,
    bloodDistribution,
  });
});

app.patch("/api/admin/users/approval", requireAuth, requireRole("admin"), async (req, res) => {
  const { phoneOrEmail, approved } = req.body;
  const db = await getDb();
  await db.collection("users").updateOne(
    { $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail?.toLowerCase() }] },
    { $set: { approved } },
  );
  const users = await db.collection<UserDoc>("users").find().toArray();
  res.json({ users: users.map(toPublicUser) });
});

app.patch("/api/admin/users/verify", requireAuth, requireRole("admin"), async (req, res) => {
  const { phoneOrEmail, verified } = req.body;
  const db = await getDb();
  await db.collection("users").updateOne(
    { $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail?.toLowerCase() }] },
    { $set: { verified } },
  );
  const users = await db.collection<UserDoc>("users").find().toArray();
  res.json({ users: users.map(toPublicUser) });
});

app.delete("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  const { phoneOrEmail } = req.body;
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({
    $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail?.toLowerCase() }],
  });
  await db.collection("users").deleteOne({
    $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail?.toLowerCase() }],
  });
  if (user?.email) {
    await db.collection("hospitalInventory").deleteOne({ hospitalEmail: user.email.toLowerCase() });
  }
  await db.collection("donors").deleteMany({
    $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail?.toLowerCase() }],
  });
  const users = await db.collection<UserDoc>("users").find().toArray();
  const donors = await db.collection("donors").find().toArray();
  res.json({ users: users.map(toPublicUser), donors });
});

app.delete("/api/admin/requests/:requestId", requireAuth, requireRole("admin"), async (req, res) => {
  const db = await getDb();
  await db.collection("requests").deleteOne({ id: req.params.requestId });
  const requests = await db.collection("requests").find().toArray();
  res.json({ requests });
});

app.patch("/api/admin/reports/:reportId", requireAuth, requireRole("admin"), async (req, res) => {
  const { status } = req.body as { status?: "open" | "resolved" };
  const db = await getDb();
  await db.collection("reports").updateOne({ id: req.params.reportId }, { $set: { status } });
  const reports = await db.collection("reports").find().toArray();
  res.json({ reports });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
