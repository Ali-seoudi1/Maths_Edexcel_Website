import { doc, getDoc } from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";

import type { UserProfile } from "../types";

const userProfileCache = new Map<string, UserProfile | null>();

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

export function cacheUserProfile(profile: UserProfile) {
  userProfileCache.set(profile.uid, profile);
}

export function clearUserProfileCache() {
  userProfileCache.clear();
}

export async function getUserProfile(
  uid: string,
  options: { forceRefresh?: boolean } = {},
): Promise<UserProfile | null> {
  if (!options.forceRefresh && userProfileCache.has(uid)) {
    return userProfileCache.get(uid) ?? null;
  }

  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));

  if (!snapshot.exists()) {
    userProfileCache.set(uid, null);
    return null;
  }

  const profile = parseUserProfile(snapshot.data(), uid);
  userProfileCache.set(uid, profile);

  return profile;
}
