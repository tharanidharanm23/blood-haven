import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import {
  bloodDistribution,
  donationHistory,
  donors,
  monthlyRequests,
  notifications,
  requests,
  TAMIL_NADU_DISTRICTS,
} from "../src/lib/mock-data.js";
import { seedAllHospitalInventories } from "../server/inventory.js";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "blood_haven";

const initialsForName = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);

  const hospitalPassword = await bcrypt.hash("hospital123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);
  const donorPassword = await bcrypt.hash("donor123", 10);

  await db.collection("donors").deleteMany({});
  await db.collection("requests").deleteMany({});
  await db.collection("reports").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("monthlyRequests").deleteMany({});
  await db.collection("bloodDistribution").deleteMany({});
  await db.collection("donationHistory").deleteMany({});
  await db.collection("districts").deleteMany({});
  await db.collection("users").deleteMany({});
  await db.collection("hospitalInventory").deleteMany({});

  const donorUsers = donors.map((donor) => ({
    name: donor.name,
    phone: donor.phone,
    email: donor.email,
    role: "donor" as const,
    district: donor.city,
    constituency: donor.constituency,
    bloodGroup: donor.bloodGroup,
    initials: initialsForName(donor.name),
    approved: true,
    passwordHash: donorPassword,
  }));

  const hospitalUsers = [
    {
      name: "Chennai Government General Hospital",
      phone: "+919500320101",
      email: "cgh@donorland.io",
      role: "hospital" as const,
      district: "Chennai",
      constituency: "Mylapore",
      address: "EVR Salai, Chennai",
      initials: "CG",
      approved: true,
      verified: true,
      passwordHash: hospitalPassword,
    },
    {
      name: "Coimbatore Medical College Hospital",
      phone: "+919500320102",
      email: "cmch@donorland.io",
      role: "hospital" as const,
      district: "Coimbatore",
      constituency: "Coimbatore South",
      address: "Avinashi Rd, Coimbatore",
      initials: "CM",
      approved: true,
      verified: false,
      passwordHash: hospitalPassword,
    },
  ];

  const adminUser = {
    name: "Network Admin",
    email: "admin@gmail.com",
    role: "admin" as const,
    district: "Chennai",
    constituency: "Kolathur",
    initials: "NA",
    approved: true,
    passwordHash: adminPassword,
  };

  await db.collection("users").insertMany([...donorUsers, ...hospitalUsers, adminUser]);
  const insertedUsers = await db.collection("users").find().toArray();
  const emailToUserId = new Map(
    insertedUsers.filter((u) => u.email).map((u) => [u.email as string, u._id]),
  );

  const donorsWithUserId = donors.map((donor, i) => {
    const user = insertedUsers.find((u) => u.phone === donor.phone);
    return { ...donor, userId: user?._id?.toHexString() };
  });
  await db.collection("donors").insertMany(donorsWithUserId);

  const requestsWithOwners = requests.map((req) => {
    const hospital = hospitalUsers.find((h) => h.name === req.hospital);
    const userId = hospital?.email ? emailToUserId.get(hospital.email)?.toHexString() : undefined;
    return {
      ...req,
      requesterUserId: userId,
      requesterEmail: hospital?.email ?? req.requesterEmail,
      requesterPhone: hospital?.phone ?? req.requesterPhone,
    };
  });
  await db.collection("requests").insertMany(requestsWithOwners);

  const hospitalEmails = hospitalUsers.map((h) => h.email);
  await seedAllHospitalInventories(db, hospitalEmails);

  if (notifications.length > 0) {
    await db.collection("notifications").insertMany(notifications);
  }
  await db.collection("monthlyRequests").insertMany(monthlyRequests);
  await db.collection("bloodDistribution").insertMany(bloodDistribution);
  await db.collection("donationHistory").insertMany(donationHistory);
  await db
    .collection("districts")
    .insertMany(TAMIL_NADU_DISTRICTS.map((name) => ({ name })));

  await client.close();
  console.log(`Seeded MongoDB "${dbName}" at ${uri}`);
  console.log("Demo credentials:");
  console.log("  Admin: admin@gmail.com / admin123");
  console.log("  Hospital: cgh@donorland.io / hospital123");
  console.log("  Donor: +919500320001 / donor123");
  console.log(`Per-hospital inventory seeded for ${hospitalEmails.length} hospitals`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
