import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { LiveMeeting, LiveMeetingFormValues } from "../types";

export const liveMeetingsCollection = "liveMeetings";
const currentLiveMeetingId = "current";

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function toLiveMeeting(id: string, data: FirebaseFirestore.DocumentData): LiveMeeting {
  return {
    id,
    url: typeof data.url === "string" ? data.url : "",
    active: data.active === true,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export async function getCurrentLiveMeeting(options: { activeOnly?: boolean } = {}) {
  const snapshot = await getFirebaseAdminDb()
    .collection(liveMeetingsCollection)
    .doc(currentLiveMeetingId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const meeting = toLiveMeeting(snapshot.id, snapshot.data() ?? {});

  if (options.activeOnly && !meeting.active) {
    return null;
  }

  return meeting;
}

export async function saveCurrentLiveMeeting(values: LiveMeetingFormValues, adminId: string) {
  const ref = getFirebaseAdminDb().collection(liveMeetingsCollection).doc(currentLiveMeetingId);
  const snapshot = await ref.get();
  const record = {
    url: values.url,
    active: values.active,
    createdBy: snapshot.exists ? snapshot.data()?.createdBy ?? adminId : adminId,
    updatedAt: FieldValue.serverTimestamp(),
    ...(snapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  await ref.set(record, { merge: true });
  const updated = await ref.get();

  return toLiveMeeting(updated.id, updated.data() ?? record);
}

export async function clearCurrentLiveMeeting() {
  await getFirebaseAdminDb().collection(liveMeetingsCollection).doc(currentLiveMeetingId).delete();

  return { deletedLiveMeetingId: currentLiveMeetingId };
}
