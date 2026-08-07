import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { PastPapersSettingsFormValues } from "../schemas";
import type { PastPapersSettings } from "../types";

const settingsCollection = "settings";
const resourcesDocument = "resources";

function normalizeTimestamp(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

function toPastPapersSettings(data: FirebaseFirestore.DocumentData | undefined): PastPapersSettings {
  return {
    pastPapersDriveUrl:
      typeof data?.pastPapersDriveUrl === "string" ? data.pastPapersDriveUrl : "",
    updatedAt: normalizeTimestamp(data?.updatedAt),
    updatedBy: typeof data?.updatedBy === "string" ? data.updatedBy : "",
  };
}

function getResourcesRef() {
  return getFirebaseAdminDb().collection(settingsCollection).doc(resourcesDocument);
}

export async function getPastPapersSettings() {
  const snapshot = await getResourcesRef().get();

  return toPastPapersSettings(snapshot.data());
}

export async function savePastPapersSettings(
  values: PastPapersSettingsFormValues,
  adminId: string,
) {
  const ref = getResourcesRef();

  await ref.set(
    {
      pastPapersDriveUrl: values.pastPapersDriveUrl,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminId,
    },
    { merge: true },
  );

  const snapshot = await ref.get();

  return toPastPapersSettings(snapshot.data());
}

export async function removePastPapersSettings(adminId: string) {
  const ref = getResourcesRef();

  await ref.set(
    {
      pastPapersDriveUrl: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: adminId,
    },
    { merge: true },
  );

  const snapshot = await ref.get();

  return toPastPapersSettings(snapshot.data());
}
