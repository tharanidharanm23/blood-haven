import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "blood_haven";

// 6 constituencies (Tiruppur South skipped — already exists)
const CONSTITUENCIES = [
  "Tiruppur North",
  "Avinashi (SC)",
  "Palladam",
  "Udumalaipettai",
  "Dharapuram (SC)",
  "Kangayam",
];

// 20 hospitals spread across 6 constituencies (~3-4 each)
const HOSPITALS = [
  // Tiruppur North (4)
  {
    name: "Tiruppur Government Hospital",
    email: "tpr.govt@hospital.com",
    phone: "9870600001",
    constituency: "Tiruppur North",
    address: "1, Hospital Road, Tiruppur North",
  },
  {
    name: "KG Hospital Tiruppur",
    email: "kg.tpr@hospital.com",
    phone: "9870600002",
    constituency: "Tiruppur North",
    address: "45, Kumaran Road, Tiruppur",
  },
  {
    name: "Sri Ramakrishna Hospital Tiruppur",
    email: "srk.tpr@hospital.com",
    phone: "9870600003",
    constituency: "Tiruppur North",
    address: "12, Palladam Road, Tiruppur",
  },
  {
    name: "Lotus Hospital",
    email: "lotus.tpr@hospital.com",
    phone: "9870600004",
    constituency: "Tiruppur North",
    address: "78, Anna Nagar, Tiruppur",
  },

  // Avinashi (3)
  {
    name: "Avinashi Government Hospital",
    email: "avinashi.govt@hospital.com",
    phone: "9870600005",
    constituency: "Avinashi (SC)",
    address: "Main Road, Avinashi",
  },
  {
    name: "Revathi Medical Centre Avinashi",
    email: "revathi.avi@hospital.com",
    phone: "9870600006",
    constituency: "Avinashi (SC)",
    address: "22, Bazaar Street, Avinashi",
  },
  {
    name: "Sri Sakthi Hospital Avinashi",
    email: "sakthi.avi@hospital.com",
    phone: "9870600007",
    constituency: "Avinashi (SC)",
    address: "15, Station Road, Avinashi",
  },

  // Palladam (3)
  {
    name: "Palladam Government Hospital",
    email: "palladam.govt@hospital.com",
    phone: "9870600008",
    constituency: "Palladam",
    address: "1, GH Road, Palladam",
  },
  {
    name: "Shree Clinic & Hospital Palladam",
    email: "shree.pld@hospital.com",
    phone: "9870600009",
    constituency: "Palladam",
    address: "44, Tiruppur Road, Palladam",
  },
  {
    name: "Annai Hospital Palladam",
    email: "annai.pld@hospital.com",
    phone: "9870600010",
    constituency: "Palladam",
    address: "9, Market Street, Palladam",
  },

  // Udumalaipettai (4)
  {
    name: "Udumalaipettai Government Hospital",
    email: "udp.govt@hospital.com",
    phone: "9870600011",
    constituency: "Udumalaipettai",
    address: "1, Hospital Road, Udumalaipettai",
  },
  {
    name: "Meenakshi Hospital Udumalpet",
    email: "meenakshi.udp@hospital.com",
    phone: "9870600012",
    constituency: "Udumalaipettai",
    address: "33, Dharapuram Road, Udumalpet",
  },
  {
    name: "Vinayaga Hospital Udumalpet",
    email: "vinayaga.udp@hospital.com",
    phone: "9870600013",
    constituency: "Udumalaipettai",
    address: "18, Pollachi Road, Udumalpet",
  },
  {
    name: "RKV Hospital Udumalpet",
    email: "rkv.udp@hospital.com",
    phone: "9870600014",
    constituency: "Udumalaipettai",
    address: "55, Main Bazaar, Udumalpet",
  },

  // Dharapuram (3)
  {
    name: "Dharapuram Government Hospital",
    email: "dhp.govt@hospital.com",
    phone: "9870600015",
    constituency: "Dharapuram (SC)",
    address: "1, GH Road, Dharapuram",
  },
  {
    name: "Sree Abirami Hospital Dharapuram",
    email: "abirami.dhp@hospital.com",
    phone: "9870600016",
    constituency: "Dharapuram (SC)",
    address: "25, Kangayam Road, Dharapuram",
  },
  {
    name: "Mani Hospital Dharapuram",
    email: "mani.dhp@hospital.com",
    phone: "9870600017",
    constituency: "Dharapuram (SC)",
    address: "10, Bus Stand Road, Dharapuram",
  },

  // Kangayam (3)
  {
    name: "Kangayam Government Hospital",
    email: "kangayam.govt@hospital.com",
    phone: "9870600018",
    constituency: "Kangayam",
    address: "1, Hospital Road, Kangayam",
  },
  {
    name: "Surya Hospital Kangayam",
    email: "surya.kgm@hospital.com",
    phone: "9870600019",
    constituency: "Kangayam",
    address: "30, Erode Road, Kangayam",
  },
  {
    name: "Grace Hospital Kangayam",
    email: "grace.kgm@hospital.com",
    phone: "9870600020",
    constituency: "Kangayam",
    address: "7, Market Road, Kangayam",
  },
];

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const passwordHash = await bcrypt.hash("hospital123", 10);

  for (const h of HOSPITALS) {
    const doc = {
      name: h.name,
      email: h.email,
      passwordHash,
      role: "hospital" as const,
      district: "Tiruppur",
      constituency: h.constituency,
      phone: h.phone,
      address: h.address,
      approved: true,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    await db.collection("users").updateOne({ email: h.email }, { $set: doc }, { upsert: true });
  }

  await client.close();
  console.log(`✅ Seeded 20 Tiruppur hospitals into "${dbName}" at ${uri}`);
  console.log(`   Password for all: hospital123`);
  console.log(`   Login with email (e.g. tpr.govt@hospital.com)`);
  console.log(`   Constituencies covered: ${CONSTITUENCIES.join(", ")}`);
  console.log(`   Tiruppur South skipped (already exists)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
