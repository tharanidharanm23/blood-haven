import type { Db, Document } from "mongodb";
import { ObjectId } from "mongodb";
import type { BloodGroup, District, Role } from "../src/lib/mock-data.js";
import { toIdString } from "./db.js";

export type UserDoc = Document & {
  _id?: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: Role;
  district: District;
  constituency: string;
  bloodGroup?: BloodGroup;
  address?: string;
  initials?: string;
  approved?: boolean;
  verified?: boolean;
};

export type PublicUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  district: District;
  constituency: string;
  bloodGroup?: BloodGroup;
  address?: string;
  initials: string;
  approved?: boolean;
  verified?: boolean;
};

const initialsForName = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function toPublicUser(doc: UserDoc): PublicUser {
  return {
    id: toIdString(doc._id!),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    role: doc.role,
    district: doc.district,
    constituency: doc.constituency,
    bloodGroup: doc.bloodGroup,
    address: doc.address,
    initials: doc.initials ?? initialsForName(doc.name),
    approved: doc.approved,
    verified: doc.verified,
  };
}

export async function findUserByLogin(
  db: Db,
  role: Role,
  phoneOrEmail: string,
): Promise<UserDoc | null> {
  const normalized = phoneOrEmail.toLowerCase();
  return db.collection<UserDoc>("users").findOne({
    role,
    $or: [
      { email: normalized },
      { email: phoneOrEmail.toLowerCase() },
      { phone: phoneOrEmail },
    ],
  });
}

export async function findUserById(db: Db, id: string): Promise<UserDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  return db.collection<UserDoc>("users").findOne({ _id: new ObjectId(id) });
}

export async function findUserByEmail(db: Db, email: string): Promise<UserDoc | null> {
  return db.collection<UserDoc>("users").findOne({ email: email.toLowerCase() });
}
