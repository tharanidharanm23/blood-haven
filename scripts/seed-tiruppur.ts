import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "blood_haven";

const CONSTITUENCIES = [
  "Tiruppur North",
  "Tiruppur South",
  "Avinashi (SC)",
  "Palladam",
  "Udumalaipettai",
  "Dharapuram (SC)",
  "Kangayam",
];

const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

const SAMPLE_USERS = [
  { name: "Rajesh Murugan",     bg: "O+",  phone: "9876500001", constituency: "Tiruppur North" },
  { name: "Kavitha Selvam",     bg: "A+",  phone: "9876500002", constituency: "Tiruppur South" },
  { name: "Suresh Natarajan",   bg: "B+",  phone: "9876500003", constituency: "Avinashi (SC)" },
  { name: "Priya Devi",         bg: "O-",  phone: "9876500004", constituency: "Palladam" },
  { name: "Gopal Krishnan",     bg: "AB+", phone: "9876500005", constituency: "Udumalaipettai" },
  { name: "Meena Sundaram",     bg: "A-",  phone: "9876500006", constituency: "Dharapuram (SC)" },
  { name: "Karthik Velan",      bg: "B-",  phone: "9876500007", constituency: "Kangayam" },
  { name: "Deepa Ramasamy",     bg: "O+",  phone: "9876500008", constituency: "Tiruppur North" },
  { name: "Arun Palani",        bg: "A+",  phone: "9876500009", constituency: "Tiruppur South" },
  { name: "Lakshmi Ganesh",     bg: "AB-", phone: "9876500010", constituency: "Avinashi (SC)" },
  { name: "Venkatesh Ravi",     bg: "B+",  phone: "9876500011", constituency: "Palladam" },
  { name: "Saranya Moorthy",    bg: "O-",  phone: "9876500012", constituency: "Udumalaipettai" },
  { name: "Ramesh Balan",       bg: "A+",  phone: "9876500013", constituency: "Dharapuram (SC)" },
  { name: "Nithya Shankar",     bg: "O+",  phone: "9876500014", constituency: "Kangayam" },
  { name: "Dinesh Kumar",       bg: "B-",  phone: "9876500015", constituency: "Tiruppur North" },
  { name: "Revathi Anand",      bg: "AB+", phone: "9876500016", constituency: "Tiruppur South" },
  { name: "Senthil Arumugam",   bg: "A-",  phone: "9876500017", constituency: "Palladam" },
  { name: "Jaya Lakshmi",       bg: "O+",  phone: "9876500018", constituency: "Udumalaipettai" },
  { name: "Manikandan Pillai",  bg: "B+",  phone: "9876500019", constituency: "Dharapuram (SC)" },
  { name: "Anusha Pradeep",     bg: "AB-", phone: "9876500020", constituency: "Kangayam" },
];

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const passwordHash = await bcrypt.hash("donor123", 10);

  const userDocs = SAMPLE_USERS.map((u) => ({
    name: u.name,
    passwordHash,
    role: "donor" as const,
    bloodGroup: u.bg,
    district: "Tiruppur",
    constituency: u.constituency,
    phone: u.phone,
    address: `${Math.floor(Math.random() * 200) + 1}, Main Road, ${u.constituency}, Tiruppur`,
    approved: true,
    createdAt: new Date().toISOString(),
  }));

  const donorDocs = SAMPLE_USERS.map((u, i) => ({
    id: `D-TPR-${String(i + 1).padStart(3, "0")}`,
    name: u.name,
    bloodGroup: u.bg,
    phone: u.phone,
    available: Math.random() > 0.25, // ~75% available
    lastDonation: randomPastDate(),
    city: "Tiruppur",
    constituency: u.constituency,
    lifetimeDonations: Math.floor(Math.random() * 10),
  }));

  // Upsert so re-running doesn't duplicate
  for (const user of userDocs) {
    await db.collection("users").updateOne(
      { phone: user.phone },
      { $set: user },
      { upsert: true },
    );
  }

  for (const donor of donorDocs) {
    await db.collection("donors").updateOne(
      { phone: donor.phone },
      { $set: donor },
      { upsert: true },
    );
  }

  await client.close();
  console.log(`✅ Seeded 20 Tiruppur donor users into "${dbName}" at ${uri}`);
  console.log(`   Password for all: donor123`);
  console.log(`   Phones: 9876500001 – 9876500020`);
  console.log(`   Constituencies: ${CONSTITUENCIES.join(", ")}`);
}

function randomPastDate() {
  const now = Date.now();
  const daysAgo = Math.floor(Math.random() * 365) + 30; // 30–395 days ago
  return new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
