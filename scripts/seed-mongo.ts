import { MongoClient, type Collection, type Document } from "mongodb";
import {
  bloodDistribution,
  donationHistory,
  donors,
  inventory,
  monthlyRequests,
  notifications,
  requests,
  TAMIL_NADU_DISTRICTS,
} from "../src/lib/mock-data";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "blood_haven";

async function resetCollection<T extends Document>(collection: Collection<T>, docs: T[]) {
  await collection.deleteMany({});
  if (docs.length > 0) {
    await collection.insertMany(docs);
  }
}

async function main() {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);

  await Promise.all([
    resetCollection(db.collection("donors"), donors),
    resetCollection(db.collection("requests"), requests),
    resetCollection(db.collection("inventory"), inventory),
    resetCollection(db.collection("notifications"), notifications),
    resetCollection(db.collection("monthlyRequests"), monthlyRequests),
    resetCollection(db.collection("bloodDistribution"), bloodDistribution),
    resetCollection(db.collection("donationHistory"), donationHistory),
    resetCollection(
      db.collection("districts"),
      TAMIL_NADU_DISTRICTS.map((name) => ({ name })),
    ),
  ]);

  await client.close();
  console.log(`Seeded MongoDB database "${dbName}" at ${uri}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
