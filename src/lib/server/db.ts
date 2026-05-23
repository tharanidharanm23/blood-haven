import "@tanstack/react-start/server-only";

import { MongoClient, type Db, type Document } from "mongodb";
import {
  BLOOD_GROUPS,
  bloodDistribution,
  donationHistory,
  donors,
  monthlyRequests,
  requests,
} from "@/lib/mock-data";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB ?? "blood_haven";

declare global {
  // eslint-disable-next-line no-var
  var __bloodHavenMongoClient: Promise<MongoClient> | undefined;
}

function getClient() {
  if (!globalThis.__bloodHavenMongoClient) {
    globalThis.__bloodHavenMongoClient = new MongoClient(uri).connect();
  }

  return globalThis.__bloodHavenMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

export async function seedDatabase() {
  const db = await getDb();
  const markerCollection = db.collection<{ key: string; removedAt?: string }>("appMeta");
  const marker = await markerCollection.findOne({ key: "fixtures-removed-v1" });

  if (marker) return;

  const donorFixtureIds = donors.map((d) => d.id);
  const requestFixtureIds = requests.map((r) => r.id);

  await Promise.all([
    db.collection("donors").deleteMany({ id: { $in: donorFixtureIds } }),
    db.collection("requests").deleteMany({ id: { $in: requestFixtureIds } }),
    db.collection("inventory").deleteMany({ bloodGroup: { $in: BLOOD_GROUPS } }),
    db.collection("notifications").deleteMany({
      $or: [
        { id: { $in: ["N1", "N2", "N3", "N4"] } },
        { title: { $in: ["Match Found", "Critical Request", "Low Inventory", "New Donor Nearby"] } },
      ],
    }),
    db.collection("monthlyRequests").deleteMany({ month: { $in: monthlyRequests.map((m) => m.month) } }),
    db.collection("bloodDistribution").deleteMany({ name: { $in: bloodDistribution.map((b) => b.name) } }),
    db.collection("donationHistory").deleteMany({ donorId: { $in: donationHistory.map((h) => h.donorId) } }),
    markerCollection.insertOne({ key: "fixtures-removed-v1", removedAt: new Date().toISOString() }),
  ]);
}

export async function readCollection<T extends Document>(name: string): Promise<T[]> {
  await seedDatabase();
  const db = await getDb();
  return db.collection<T>(name).find({}, { projection: { _id: 0 } }).toArray() as Promise<T[]>;
}
