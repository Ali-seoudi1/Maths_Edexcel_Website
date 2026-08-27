import { Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

/**
 * Helpers for deciding which assignments / quizzes / exams a given student is
 * actually responsible for.
 *
 * A piece of work only "belongs" to a student when it was created / published /
 * scheduled for students strictly after the exact moment that student joined.
 * Work that already existed before the student registered must never be reported
 * against them as "No submission" or missing work.
 *
 * The student join date is the `createdAt` timestamp written to the `users`
 * document when the account is created (see `createStudentAccount`).
 */

export function normalizeRegistrationDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  return null;
}

/**
 * Reads a single student's registration date. Returns `null` for legacy
 * accounts that predate the `createdAt` field – those students keep their full
 * activity history untouched.
 */
export async function getStudentRegistrationDate(studentId: string): Promise<string | null> {
  const snapshot = await getFirebaseAdminDb().collection("users").doc(studentId).get();

  if (!snapshot.exists) {
    return null;
  }

  return normalizeRegistrationDate(snapshot.data()?.createdAt);
}

/**
 * Batch variant used by admin screens that need registration dates for many
 * students at once (per-assignment submission tables, per-student reports).
 */
export async function getStudentRegistrationDates(
  studentIds: string[],
): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(studentIds)).filter(Boolean);

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const db = getFirebaseAdminDb();
  const snapshots = await db.getAll(...uniqueIds.map((id) => db.collection("users").doc(id)));

  return new Map(
    snapshots.map((snapshot) => [snapshot.id, normalizeRegistrationDate(snapshot.data()?.createdAt)]),
  );
}

/** The moment an assignment became a student's responsibility. */
export function getAssignmentRelevanceDate(assignment: {
  createdAt: string | null;
  deadline: string | null;
}): string | null {
  return assignment.createdAt ?? assignment.deadline;
}

/** The moment a quiz / exam became available to students. */
export function getTimedResourceRelevanceDate(resource: {
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string | null;
}): string | null {
  return resource.publishedAt ?? resource.scheduledAt ?? resource.createdAt;
}

/**
 * Returns `true` when a piece of work should be tracked for a student.
 *
 * - No registration date (legacy account) -> always relevant (never regress an
 *   existing student's history).
 * - No relevance date on the work -> keep it visible rather than hide silently.
 * - Otherwise the work must have become available strictly after the exact
 *   moment the student registered (`users/{uid}.createdAt`). This is a direct
 *   timestamp comparison: content published earlier the same day a student
 *   joins does NOT count.
 */
export function isWorkRelevantToStudent(
  relevanceDate: string | null,
  registrationDate: string | null,
): boolean {
  if (!registrationDate) {
    return true;
  }

  if (!relevanceDate) {
    return true;
  }

  const registrationTime = new Date(registrationDate).getTime();

  if (Number.isNaN(registrationTime)) {
    return true;
  }

  const relevanceTime = new Date(relevanceDate).getTime();

  if (Number.isNaN(relevanceTime)) {
    return true;
  }

  return relevanceTime > registrationTime;
}
