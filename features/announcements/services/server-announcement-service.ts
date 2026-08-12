import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { Announcement, AnnouncementFormValues } from "../types";

export const announcementsCollection = "announcements";
export const announcementReadsCollection = "announcementReads";

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function toAnnouncement(id: string, data: FirebaseFirestore.DocumentData): Announcement {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    message: typeof data.message === "string" ? data.message : "",
    published: data.published === true,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : "",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function readDocumentId(studentId: string, announcementId: string) {
  return `${studentId}_${announcementId}`;
}

function sortAnnouncements(items: Announcement[]) {
  return items.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function listAnnouncements(options: { publishedOnly?: boolean } = {}) {
  let query: FirebaseFirestore.Query = getFirebaseAdminDb().collection(announcementsCollection);

  if (options.publishedOnly) {
    query = query.where("published", "==", true);
  }

  const snapshot = await query.get();

  return sortAnnouncements(snapshot.docs.map((doc) => toAnnouncement(doc.id, doc.data())));
}

export async function createAnnouncement(values: AnnouncementFormValues, adminId: string) {
  const ref = getFirebaseAdminDb().collection(announcementsCollection).doc();
  const record = {
    title: values.title,
    message: values.message,
    published: values.published,
    createdBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const snapshot = await ref.get();

  return toAnnouncement(snapshot.id, snapshot.data() ?? record);
}

export async function updateAnnouncement(id: string, values: AnnouncementFormValues) {
  const ref = getFirebaseAdminDb().collection(announcementsCollection).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Announcement was not found.");
  }

  await ref.update({ ...values, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();

  return toAnnouncement(updated.id, updated.data() ?? {});
}

export async function deleteAnnouncement(id: string) {
  const db = getFirebaseAdminDb();
  await db.collection(announcementsCollection).doc(id).delete();

  const reads = await db.collection(announcementReadsCollection).where("announcementId", "==", id).get();
  await Promise.all(reads.docs.map((doc) => doc.ref.delete()));

  return { deletedAnnouncementId: id };
}

export async function getUnreadAnnouncementCount(studentId: string) {
  const [announcements, reads] = await Promise.all([
    listAnnouncements({ publishedOnly: true }),
    getFirebaseAdminDb().collection(announcementReadsCollection).where("studentId", "==", studentId).get(),
  ]);
  const readIds = new Set(reads.docs.map((doc) => doc.data().announcementId).filter((id): id is string => typeof id === "string"));

  return announcements.filter((announcement) => !readIds.has(announcement.id)).length;
}

export async function markAnnouncementsRead(studentId: string) {
  const announcements = await listAnnouncements({ publishedOnly: true });
  const batch = getFirebaseAdminDb().batch();

  announcements.forEach((announcement) => {
    const ref = getFirebaseAdminDb()
      .collection(announcementReadsCollection)
      .doc(readDocumentId(studentId, announcement.id));
    batch.set(
      ref,
      {
        studentId,
        announcementId: announcement.id,
        readAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();

  return { readCount: announcements.length };
}
