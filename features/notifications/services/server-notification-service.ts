import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import type { CreateNotificationInput, NotificationType, StudentNotification } from "../types";

export const notificationsCollection = "notifications";
export const reportStartYear = 2026;
export const reportStartMonth = 8;

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function toNotification(id: string, data: FirebaseFirestore.DocumentData): StudentNotification {
  return {
    id,
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    type: isNotificationType(data.type) ? data.type : "announcement",
    title: typeof data.title === "string" ? data.title : "",
    message: typeof data.message === "string" ? data.message : "",
    link: typeof data.link === "string" ? data.link : "/dashboard",
    relatedId: typeof data.relatedId === "string" ? data.relatedId : null,
    read: data.read === true,
    createdAt: normalizeTimestamp(data.createdAt),
  };
}

function isNotificationType(value: unknown): value is NotificationType {
  return (
    value === "assignment" ||
    value === "assignment_grade" ||
    value === "quiz_grade" ||
    value === "exam_grade" ||
    value === "quiz_scheduled" ||
    value === "exam_scheduled" ||
    value === "quiz_feedback" ||
    value === "exam_feedback" ||
    value === "announcement" ||
    value === "live_meeting" ||
    value === "monthly_report"
  );
}

function notificationDocumentId(input: Pick<CreateNotificationInput, "studentId" | "type" | "relatedId">) {
  return [input.studentId, input.type, input.relatedId ?? "general"].join("__");
}

function isTrackedReportMonth(year: number, month: number) {
  return year > reportStartYear || (year === reportStartYear && month >= reportStartMonth);
}

function isValidNotification(notification: StudentNotification) {
  if (notification.type !== "monthly_report") {
    return true;
  }

  if (!notification.relatedId) {
    return false;
  }

  const [yearValue, monthValue] = notification.relatedId.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);

  return Number.isInteger(year) && Number.isInteger(month) && isTrackedReportMonth(year, month);
}

export async function listActiveStudentIds() {
  const snapshot = await getFirebaseAdminDb().collection("users").where("role", "==", "student").get();

  return snapshot.docs
    .filter((doc) => doc.data().active === true)
    .map((doc) => doc.id);
}

export async function createNotification(input: CreateNotificationInput) {
  const ref = getFirebaseAdminDb().collection(notificationsCollection).doc(notificationDocumentId(input));
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return toNotification(snapshot.id, snapshot.data() ?? {});
  }

  const record = {
    studentId: input.studentId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    relatedId: input.relatedId ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const saved = await ref.get();

  return toNotification(saved.id, saved.data() ?? record);
}

export async function replaceNotification(input: CreateNotificationInput) {
  const ref = getFirebaseAdminDb().collection(notificationsCollection).doc(notificationDocumentId(input));
  const record = {
    studentId: input.studentId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    relatedId: input.relatedId ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await ref.set(record);
  const saved = await ref.get();

  return toNotification(saved.id, saved.data() ?? record);
}

export async function createNotificationForStudents(
  studentIds: string[],
  input: Omit<CreateNotificationInput, "studentId">,
) {
  await Promise.all(
    studentIds.map((studentId) =>
      createNotification({
        ...input,
        studentId,
      }),
    ),
  );
}

export async function replaceNotificationForStudents(
  studentIds: string[],
  input: Omit<CreateNotificationInput, "studentId">,
) {
  await Promise.all(
    studentIds.map((studentId) =>
      replaceNotification({
        ...input,
        studentId,
      }),
    ),
  );
}

export async function replaceNotificationForAllActiveStudents(input: Omit<CreateNotificationInput, "studentId">) {
  const studentIds = await listActiveStudentIds();
  await replaceNotificationForStudents(studentIds, input);
}

export async function createNotificationForAllActiveStudents(input: Omit<CreateNotificationInput, "studentId">) {
  const studentIds = await listActiveStudentIds();
  await createNotificationForStudents(studentIds, input);
}

export async function deleteNotificationsByTypeAndRelatedId(type: NotificationType, relatedId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(notificationsCollection)
    .where("type", "==", type)
    .where("relatedId", "==", relatedId)
    .get();

  if (snapshot.empty) {
    return { deletedCount: 0 };
  }

  const batch = getFirebaseAdminDb().batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return { deletedCount: snapshot.size };
}

export async function listStudentNotifications(
  studentId: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
) {
  // Official monthly report notifications are created only when a teacher
  // explicitly publishes a report – never on read.
  const snapshot = await getFirebaseAdminDb()
    .collection(notificationsCollection)
    .where("studentId", "==", studentId)
    .get();

  return snapshot.docs
    .map((doc) => toNotification(doc.id, doc.data()))
    .filter(isValidNotification)
    .filter((notification) => (options.unreadOnly ? !notification.read : true))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, options.limit ?? 100);
}

export async function markNotificationRead(studentId: string, notificationId: string) {
  const ref = getFirebaseAdminDb().collection(notificationsCollection).doc(notificationId);
  const snapshot = await ref.get();
  const notification = snapshot.data();

  if (!snapshot.exists || notification?.studentId !== studentId) {
    throw new Error("Notification was not found.");
  }

  await ref.update({ read: true });
  const updated = await ref.get();

  return toNotification(updated.id, updated.data() ?? {});
}

export async function markAllNotificationsRead(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(notificationsCollection)
    .where("studentId", "==", studentId)
    .where("read", "==", false)
    .get();
  const batch = getFirebaseAdminDb().batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();

  return { readCount: snapshot.size };
}
