import type { BloodGroup, InventoryItem } from "../src/lib/mock-data.js";
import { BLOOD_GROUPS, inventory as defaultInventory } from "../src/lib/mock-data.js";
import type { Db } from "mongodb";

export type HospitalInventoryDoc = {
  hospitalEmail: string;
  items: InventoryItem[];
};

export function defaultInventoryItems(): InventoryItem[] {
  return JSON.parse(JSON.stringify(defaultInventory)) as InventoryItem[];
}

export async function getHospitalInventory(db: Db, hospitalEmail: string): Promise<InventoryItem[]> {
  const doc = await db
    .collection<HospitalInventoryDoc>("hospitalInventory")
    .findOne({ hospitalEmail: hospitalEmail.toLowerCase() });
  if (doc?.items?.length) return doc.items;
  const items = defaultInventoryItems();
  await db.collection<HospitalInventoryDoc>("hospitalInventory").updateOne(
    { hospitalEmail: hospitalEmail.toLowerCase() },
    { $set: { hospitalEmail: hospitalEmail.toLowerCase(), items } },
    { upsert: true },
  );
  return items;
}

export async function setHospitalInventory(
  db: Db,
  hospitalEmail: string,
  items: InventoryItem[],
): Promise<InventoryItem[]> {
  await db.collection<HospitalInventoryDoc>("hospitalInventory").updateOne(
    { hospitalEmail: hospitalEmail.toLowerCase() },
    { $set: { hospitalEmail: hospitalEmail.toLowerCase(), items } },
    { upsert: true },
  );
  return items;
}

export async function addUnits(
  db: Db,
  hospitalEmail: string,
  bloodGroup: BloodGroup,
  units: number,
  expiry: string,
): Promise<InventoryItem[]> {
  const items = await getHospitalInventory(db, hospitalEmail);
  const next = items.map((item) =>
    item.bloodGroup === bloodGroup
      ? { ...item, units: item.units + units, expiry }
      : item,
  );
  return setHospitalInventory(db, hospitalEmail, next);
}

export async function transferUnits(
  db: Db,
  fromEmail: string,
  toEmail: string,
  bloodGroup: BloodGroup,
  units: number,
): Promise<{ from: InventoryItem[]; to: InventoryItem[] }> {
  const fromItems = await getHospitalInventory(db, fromEmail);
  const source = fromItems.find((i) => i.bloodGroup === bloodGroup);
  if (!source || source.units < units) {
    throw new Error("Insufficient inventory for transfer");
  }
  const updatedFrom = fromItems.map((item) =>
    item.bloodGroup === bloodGroup ? { ...item, units: item.units - units } : item,
  );
  const toItems = await getHospitalInventory(db, toEmail);
  const updatedTo = toItems.map((item) =>
    item.bloodGroup === bloodGroup ? { ...item, units: item.units + units } : item,
  );
  await setHospitalInventory(db, fromEmail, updatedFrom);
  await setHospitalInventory(db, toEmail, updatedTo);
  return { from: updatedFrom, to: updatedTo };
}

export async function seedAllHospitalInventories(
  db: Db,
  hospitalEmails: string[],
): Promise<void> {
  const template = defaultInventoryItems();
  for (const email of hospitalEmails) {
    const key = email.toLowerCase();
    const existing = await db.collection("hospitalInventory").findOne({ hospitalEmail: key });
    if (!existing) {
      await db.collection("hospitalInventory").insertOne({
        hospitalEmail: key,
        items: JSON.parse(JSON.stringify(template)),
      });
    }
  }
}

export function aggregateAdminInventory(
  docs: HospitalInventoryDoc[],
): InventoryItem[] {
  const map = new Map<BloodGroup, InventoryItem>();
  for (const bg of BLOOD_GROUPS) {
    const seed = defaultInventoryItems().find((i) => i.bloodGroup === bg)!;
    map.set(bg, { ...seed, units: 0 });
  }
  for (const doc of docs) {
    for (const item of doc.items) {
      const cur = map.get(item.bloodGroup)!;
      map.set(item.bloodGroup, { ...cur, units: cur.units + item.units });
    }
  }
  return BLOOD_GROUPS.map((bg) => map.get(bg)!);
}
