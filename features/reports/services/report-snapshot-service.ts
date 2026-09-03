import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import { createNotification } from "@/features/notifications/services/server-notification-service";

import type {
  MonthlyReport,
  MonthlyReportSnapshot,
  MonthlyReportSnapshotSummary,
  MonthlyReportStatusResult,
} from "../types";
import { generateMonthlyReport } from "./server-report-service";

export const monthlyReportsCollection = "monthlyReports";

/** First month that officially supports monthly reports (August 2026). */
export const reportPeriodFloor = "2026-08";

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

/** `YYYY-MM` string -> `{ year, month }` (month is 1-12). Throws when invalid. */
export function parseReportPeriod(period: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) {
    throw new Error("Use a month in YYYY-MM format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new Error("Use a month in YYYY-MM format.");
  }

  if (period < reportPeriodFloor) {
    throw new Error("Monthly reports are only available from August 2026 onwards.");
  }

  return { year, month };
}

export function formatReportPeriodLabel(period: string): string {
  const { year, month } = parseReportPeriod(period);
  const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );

  return `${monthName} ${year}`;
}

/**
 * Deterministic document id so that a given student + period can only ever map
 * to a single official monthly report. This is the primary duplicate guard.
 */
export function reportSnapshotDocumentId(studentId: string, period: string): string {
  return `${studentId}__${period}`;
}

/**
 * Firestore rejects `undefined` values. The live report contains optional
 * fields (`resourceId`, `submissionId`, `files`) that are simply omitted on some
 * items, so round-trip through JSON to drop them before persisting.
 */
function toStorableReport(report: MonthlyReport): MonthlyReport {
  return JSON.parse(JSON.stringify(report)) as MonthlyReport;
}

function toSnapshot(id: string, data: FirebaseFirestore.DocumentData): MonthlyReportSnapshot {
  return {
    id,
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    year: typeof data.year === "number" ? data.year : 0,
    month: typeof data.month === "number" ? data.month : 0,
    period: typeof data.period === "string" ? data.period : "",
    status: data.status === "draft" ? "draft" : "published",
    report: (data.report ?? null) as MonthlyReport,
    generatedAt: normalizeTimestamp(data.generatedAt),
    generatedBy: typeof data.generatedBy === "string" ? data.generatedBy : "",
    publishedAt: normalizeTimestamp(data.publishedAt),
    publishedBy: typeof data.publishedBy === "string" ? data.publishedBy : "",
  };
}

function toSummary(snapshot: MonthlyReportSnapshot): MonthlyReportSnapshotSummary {
  return {
    id: snapshot.id,
    studentId: snapshot.studentId,
    year: snapshot.year,
    month: snapshot.month,
    period: snapshot.period,
    status: "published",
    generatedAt: snapshot.generatedAt,
    publishedAt: snapshot.publishedAt,
  };
}

/** Reads a single official report snapshot, or `null` when it was never published. */
export async function getPublishedReportSnapshot(
  studentId: string,
  period: string,
): Promise<MonthlyReportSnapshot | null> {
  parseReportPeriod(period);

  const ref = getFirebaseAdminDb()
    .collection(monthlyReportsCollection)
    .doc(reportSnapshotDocumentId(studentId, period));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return null;
  }

  const record = toSnapshot(snapshot.id, snapshot.data() ?? {});

  return record.status === "published" ? record : null;
}

export async function getReportSnapshotStatus(
  studentId: string,
  period: string,
): Promise<MonthlyReportStatusResult> {
  parseReportPeriod(period);

  const ref = getFirebaseAdminDb()
    .collection(monthlyReportsCollection)
    .doc(reportSnapshotDocumentId(studentId, period));
  const doc = await ref.get();

  if (!doc.exists) {
    return { status: "not_generated", period };
  }

  const snapshot = toSnapshot(doc.id, doc.data() ?? {});

  if (snapshot.status === "draft") {
    return { status: "draft", period, snapshot };
  }

  return { status: "published", period, snapshot };
}

/** All published monthly reports for a student, newest month first. */
export async function listPublishedReportSnapshots(
  studentId: string,
): Promise<MonthlyReportSnapshotSummary[]> {
  const query = await getFirebaseAdminDb()
    .collection(monthlyReportsCollection)
    .where("studentId", "==", studentId)
    .get();

  return query.docs
    .map((doc) => toSnapshot(doc.id, doc.data()))
    .filter((snapshot) => snapshot.status === "published")
    .sort((a, b) => (a.period < b.period ? 1 : a.period > b.period ? -1 : 0))
    .map(toSummary);
}

export async function generateMonthlyReportDraft(input: {
  studentId: string;
  period: string;
  adminId: string;
}): Promise<{ snapshot: MonthlyReportSnapshot; alreadyExists: boolean }> {
  const { studentId, period, adminId } = input;
  const { year, month } = parseReportPeriod(period);
  const db = getFirebaseAdminDb();
  const ref = db
    .collection(monthlyReportsCollection)
    .doc(reportSnapshotDocumentId(studentId, period));
  const existing = await ref.get();

  if (existing.exists) {
    return { snapshot: toSnapshot(existing.id, existing.data() ?? {}), alreadyExists: true };
  }

  const report = await generateMonthlyReport(studentId, period);
  const nowIso = Timestamp.now().toDate().toISOString();
  const record = {
    studentId,
    year,
    month,
    period,
    status: "draft" as const,
    report: toStorableReport(report),
    generatedAt: nowIso,
    generatedBy: adminId,
    publishedAt: null,
    publishedBy: null,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await ref.create(record);
  } catch {
    const raced = await ref.get();

    if (raced.exists) {
      return { snapshot: toSnapshot(raced.id, raced.data() ?? {}), alreadyExists: true };
    }

    throw new Error("The report draft could not be generated. Try again in a moment.");
  }

  const saved = await ref.get();

  return { snapshot: toSnapshot(saved.id, saved.data() ?? record), alreadyExists: false };
}

/**
 * Teacher-controlled finalization. Calculates the live report for the period
 * using the existing engine (which already applies student registration
 * eligibility filtering), freezes it as a snapshot, marks it published, and
 * fires the "report ready" notification exactly once.
 *
 * If an official report already exists it is NOT overwritten – the caller is
 * told it already exists so historical data is never silently replaced.
 */
export async function publishMonthlyReportSnapshot(input: {
  studentId: string;
  period: string;
  adminId: string;
}): Promise<{ snapshot: MonthlyReportSnapshot; alreadyPublished: boolean }> {
  const { studentId, period, adminId } = input;
  const { year, month } = parseReportPeriod(period);

  const db = getFirebaseAdminDb();
  const ref = db
    .collection(monthlyReportsCollection)
    .doc(reportSnapshotDocumentId(studentId, period));

  const existing = await ref.get();

  if (existing.exists) {
    const existingSnapshot = toSnapshot(existing.id, existing.data() ?? {});

    if (existingSnapshot.status === "published") {
      return { snapshot: existingSnapshot, alreadyPublished: true };
    }

    await ref.update({
      status: "published",
      publishedAt: FieldValue.serverTimestamp(),
      publishedBy: adminId,
    });

    await createMonthlyReportNotification({
      studentId,
      period,
      year,
      month,
    });

    const savedDraft = await ref.get();

    return {
      snapshot: toSnapshot(savedDraft.id, savedDraft.data() ?? {}),
      alreadyPublished: false,
    };
  }

  const report = await generateMonthlyReport(studentId, period);
  const nowIso = Timestamp.now().toDate().toISOString();

  const record = {
    studentId,
    year,
    month,
    period,
    status: "published" as const,
    report: toStorableReport(report),
    generatedAt: nowIso,
    generatedBy: adminId,
    publishedAt: FieldValue.serverTimestamp(),
    publishedBy: adminId,
    createdAt: FieldValue.serverTimestamp(),
  };

  // `create` fails if the document was written concurrently, keeping the
  // student + period uniqueness guarantee even under a double click.
  try {
    await ref.create(record);
  } catch {
    const raced = await ref.get();

    if (raced.exists) {
      return { snapshot: toSnapshot(raced.id, raced.data() ?? {}), alreadyPublished: true };
    }

    throw new Error("The report could not be published. Try again in a moment.");
  }

  // Deterministic notification id (studentId + type + relatedId) means repeated
  // publish calls, page refreshes, and opening the bell never duplicate this.
  await createMonthlyReportNotification({ studentId, period, year, month });

  const saved = await ref.get();

  return { snapshot: toSnapshot(saved.id, saved.data() ?? record), alreadyPublished: false };
}

async function createMonthlyReportNotification(input: {
  studentId: string;
  period: string;
  year: number;
  month: number;
}) {
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(
    new Date(Date.UTC(input.year, input.month - 1, 1)),
  );

  await createNotification({
    studentId: input.studentId,
    type: "monthly_report",
    title: `Your ${monthLabel} report is ready`,
    message: `Your ${monthLabel} progress report is now available. Check your reports to review your progress.`,
    link: "/reports",
    relatedId: input.period,
  });
}

export async function deleteMonthlyReportDraft(studentId: string, period: string) {
  parseReportPeriod(period);

  const ref = getFirebaseAdminDb()
    .collection(monthlyReportsCollection)
    .doc(reportSnapshotDocumentId(studentId, period));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return { deleted: false };
  }

  const report = toSnapshot(snapshot.id, snapshot.data() ?? {});

  if (report.status === "published") {
    throw new Error("Published reports cannot be deleted as drafts.");
  }

  await ref.delete();

  return { deleted: true };
}
