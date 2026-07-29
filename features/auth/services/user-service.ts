import { doc, getDoc } from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";

import type { UserProfile } from "../types";

function isUserRole(value: unknown): value is UserProfile["role"] {
  return value === "admin" || value === "student";
}

function parseUserProfile(data: unknown, uid: string): UserProfile | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;

  if (
    record.uid !== uid ||
    typeof record.email !== "string" ||
    typeof record.fullName !== "string" ||
    !isUserRole(record.role) ||
    typeof record.active !== "boolean"
  ) {
    return null;
  }

  return {
    uid: record.uid,
    email: record.email,
    fullName: record.fullName,
    role: record.role,
    active: record.active,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return parseUserProfile(snapshot.data(), uid);
}
