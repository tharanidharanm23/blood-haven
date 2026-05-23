import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
  const dbName = process.env.MONGODB_DB ?? "blood_haven";
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  
  const hospitalUsers = await db.collection("users").find({ role: "hospital" }).toArray();
  for (const h of hospitalUsers) {
    await db.collection("hospitals").updateOne(
      { email: h.email },
      { $set: {
        id: `H-${Date.now().toString().slice(-6)}${Math.floor(Math.random()*1000)}`,
        name: h.name,
        email: h.email,
        phone: h.phone,
        district: h.district,
        constituency: h.constituency,
        address: h.address,
        verified: h.verified || false,
        createdAt: h.createdAt,
      }},
      { upsert: true }
    );
  }
  
  // Create some requests for the Tiruppur hospitals so Help Hospital page has data
  const hospitals = await db.collection("hospitals").find({ district: "Tiruppur" }).toArray();
  const requests = hospitals.slice(0, 8).map((h, i) => ({
    id: `REQ-TPR-${Math.floor(Math.random() * 9000) + 1000}`,
    hospital: h.name,
    bloodGroup: ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"][i % 8],
    units: Math.floor(Math.random() * 4) + 1,
    urgency: i % 3 === 0 ? "Critical" : "Urgent",
    location: h.district,
    constituency: h.constituency,
    requesterEmail: h.email,
    requesterPhone: h.phone,
    requesterName: h.name,
    postedMinutesAgo: Math.floor(Math.random() * 60),
    status: "Matching",
  }));

  for (const req of requests) {
    await db.collection("requests").updateOne(
      { id: req.id },
      { $set: req },
      { upsert: true }
    );
  }

  await client.close();
  console.log("Migrated hospitals to 'hospitals' collection and seeded requests!");
}

main().catch(console.error);
