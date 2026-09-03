import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { createNotification } from "@/features/notifications/services/server-notification-service";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import type {
  CombinedOfficialReport,
  CombinedReportMonthlyBreakdown,
  CombinedReportSnapshot,
  CombinedReportSummary,
  CombinedReportTrend,
  MonthlyReport,
  MonthlyReportItem,
  ReportTrendStatus,
} from "../types";
import {
  formatReportPeriodLabel,
  monthlyReportsCollection,
  parseReportPeriod,
  reportPeriodFloor,
} from "./report-snapshot-service";
import { stableTrendThreshold } from "./report-analytics-service";

export const combinedReportsCollection = "combinedReports";

export function combinedReportDocumentId(studentId: string, fromMonth: string, toMonth: string) {
  return `${studentId}__${fromMonth}__${toMonth}`;
}

type StudentProfile = {
  uid: string;
  fullName: string;
  email: string;
  studentCode: string;
};

type MonthlySnapshotRecord = {
  period: string;
  report: MonthlyReport;
};

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return null;
}

function average(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => typeof value === "number");

  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((total, value) => total + value, 0) / numbers.length;
}

function roundPercent(value: number | null) {
  return typeof value === "number" ? Math.round(value * 10) / 10 : null;
}

function toPeriod(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function nextPeriod(period: string) {
  const { year, month } = parseReportPeriod(period);
  const date = new Date(Date.UTC(year, month, 1));

  return toPeriod(date.getUTCFullYear(), date.getUTCMonth() + 1);
}

export function selectedCombinedReportPeriods(fromMonth: string, toMonth: string) {
  parseReportPeriod(fromMonth);
  parseReportPeriod(toMonth);

  if (fromMonth > toMonth) {
    throw new Error("From month must be before or the same as To month.");
  }

  const periods = [fromMonth];

  while (periods[periods.length - 1] < toMonth) {
    periods.push(nextPeriod(periods[periods.length - 1]));
  }

  return periods.filter((period) => period >= reportPeriodFloor);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function isCompletedItem(item: MonthlyReportItem) {
  return item.status === "on-time" || item.status === "late" || item.status === "graded" || item.status === "submitted";
}

function reportPerformancePercent(report: MonthlyReport) {
  const scoredItems = report.items
    .filter((item) => typeof item.score === "number" && typeof item.maxScore === "number" && item.maxScore > 0)
    .map((item) => ((item.score ?? 0) / (item.maxScore ?? 100)) * 100);

  return roundPercent(average(scoredItems));
}

function reportCompletionPercent(report: MonthlyReport) {
  const trackableItems = report.items.filter((item) => item.status !== "opened");

  if (trackableItems.length === 0) {
    return null;
  }

  const completed = trackableItems.filter(isCompletedItem).length;

  return roundPercent((completed / trackableItems.length) * 100);
}

function reportOnTimePercent(report: MonthlyReport) {
  const completed = report.items.filter(isCompletedItem);

  if (completed.length === 0) {
    return null;
  }

  const onTime = completed.filter((item) => item.status !== "late").length;

  return roundPercent((onTime / completed.length) * 100);
}

function classifyTrend(delta: number | null): ReportTrendStatus {
  if (delta === null) return "not_enough_data";
  if (delta > stableTrendThreshold) return "improving";
  if (delta < -stableTrendThreshold) return "declining";
  return "stable";
}

function countSubmittedByType(report: MonthlyReport, type: "assignment" | "quiz" | "exam") {
  return report.items.filter((item) => item.type.startsWith(type) && isCompletedItem(item)).length;
}

function toStorableReport(report: CombinedOfficialReport): CombinedOfficialReport {
  return JSON.parse(JSON.stringify(report)) as CombinedOfficialReport;
}

function toCombinedSnapshot(id: string, data: FirebaseFirestore.DocumentData): CombinedReportSnapshot {
  return {
    id,
    studentId: typeof data.studentId === "string" ? data.studentId : "",
    fromMonth: typeof data.fromMonth === "string" ? data.fromMonth : "",
    toMonth: typeof data.toMonth === "string" ? data.toMonth : "",
    periods: Array.isArray(data.periods) ? data.periods.filter((period) => typeof period === "string") : [],
    publishedPeriods: Array.isArray(data.publishedPeriods)
      ? data.publishedPeriods.filter((period) => typeof period === "string")
      : [],
    missingPeriods: Array.isArray(data.missingPeriods)
      ? data.missingPeriods.filter((period) => typeof period === "string")
      : [],
    status: data.status === "published" ? "published" : "draft",
    report: data.report as CombinedOfficialReport,
    generatedAt: normalizeTimestamp(data.generatedAt),
    generatedBy: typeof data.generatedBy === "string" ? data.generatedBy : "",
    publishedAt: normalizeTimestamp(data.publishedAt),
    publishedBy: typeof data.publishedBy === "string" ? data.publishedBy : null,
    createdAt: normalizeTimestamp(data.createdAt),
  };
}

function toSummary(snapshot: CombinedReportSnapshot): CombinedReportSummary {
  return {
    id: snapshot.id,
    studentId: snapshot.studentId,
    fromMonth: snapshot.fromMonth,
    toMonth: snapshot.toMonth,
    periods: snapshot.periods,
    publishedPeriods: snapshot.publishedPeriods,
    missingPeriods: snapshot.missingPeriods,
    status: snapshot.status,
    generatedAt: snapshot.generatedAt,
    publishedAt: snapshot.publishedAt,
  };
}

async function getStudentProfile(studentId: string): Promise<StudentProfile> {
  const snapshot = await getFirebaseAdminDb().collection("users").doc(studentId).get();
  const data = snapshot.data();

  if (!snapshot.exists || data?.role !== "student") {
    throw new Error("Student account was not found.");
  }

  return {
    uid: snapshot.id,
    fullName: typeof data.fullName === "string" && data.fullName.trim() ? data.fullName : "Student",
    email: typeof data.email === "string" ? data.email : "",
    studentCode: typeof data.studentCode === "string" ? data.studentCode : snapshot.id,
  };
}

async function listPublishedMonthlySnapshots(studentId: string, periods: string[]) {
  const queries = await Promise.all(
    chunks(periods, 30).map((periodChunk) =>
      getFirebaseAdminDb()
        .collection(monthlyReportsCollection)
        .where("studentId", "==", studentId)
        .where("period", "in", periodChunk)
        .get(),
    ),
  );

  return queries
    .flatMap((query) => query.docs)
    .map((doc) => doc.data())
    .filter((data) => data.status === "published" && typeof data.period === "string" && data.report)
    .map(
      (data): MonthlySnapshotRecord => ({
        period: data.period,
        report: data.report as MonthlyReport,
      }),
    )
    .sort((a, b) => a.period.localeCompare(b.period));
}

function buildTrend(breakdown: CombinedReportMonthlyBreakdown[]): CombinedReportTrend {
  const comparable = breakdown.filter(
    (month) => month.status === "published" && typeof month.performancePercent === "number",
  );

  if (comparable.length < 2) {
    return {
      status: "not_enough_data",
      delta: null,
      startPeriod: null,
      startPerformance: null,
      endPeriod: null,
      endPerformance: null,
    };
  }

  const start = comparable[0];
  const end = comparable[comparable.length - 1];
  const delta = roundPercent((end.performancePercent ?? 0) - (start.performancePercent ?? 0));

  return {
    status: classifyTrend(delta),
    delta,
    startPeriod: start.period,
    startPerformance: start.performancePercent,
    endPeriod: end.period,
    endPerformance: end.performancePercent,
  };
}

function buildCombinedReport(input: {
  student: StudentProfile;
  fromMonth: string;
  toMonth: string;
  periods: string[];
  monthlySnapshots: MonthlySnapshotRecord[];
}): CombinedOfficialReport {
  const reportsByPeriod = new Map(input.monthlySnapshots.map((snapshot) => [snapshot.period, snapshot.report]));
  const monthlyBreakdown = input.periods.map((period): CombinedReportMonthlyBreakdown => {
    const report = reportsByPeriod.get(period) ?? null;

    if (!report) {
      return {
        period,
        status: "missing",
        performancePercent: null,
        completionPercent: null,
        onTimePercent: null,
        assignmentsSubmitted: null,
        quizzesSubmitted: null,
        examsSubmitted: null,
        missingCount: null,
        lateCount: null,
        report: null,
      };
    }

    return {
      period,
      status: "published",
      performancePercent: reportPerformancePercent(report),
      completionPercent: reportCompletionPercent(report),
      onTimePercent: reportOnTimePercent(report),
      assignmentsSubmitted: report.totals.assignmentsSubmitted,
      quizzesSubmitted: report.totals.quizzesSubmitted || countSubmittedByType(report, "quiz"),
      examsSubmitted: countSubmittedByType(report, "exam"),
      missingCount: report.totals.noSubmissions,
      lateCount: report.totals.lateSubmissions,
      report,
    };
  });
  const publishedMonths = monthlyBreakdown.filter((month) => month.status === "published");
  const publishedPeriods = publishedMonths.map((month) => month.period);
  const missingPeriods = monthlyBreakdown.filter((month) => month.status === "missing").map((month) => month.period);

  return {
    student: input.student,
    fromMonth: input.fromMonth,
    toMonth: input.toMonth,
    periods: input.periods,
    publishedPeriods,
    missingPeriods,
    overallPerformance: roundPercent(average(publishedMonths.map((month) => month.performancePercent))),
    completionPercent: roundPercent(average(publishedMonths.map((month) => month.completionPercent))),
    onTimePercent: roundPercent(average(publishedMonths.map((month) => month.onTimePercent))),
    totals: {
      assignmentsSubmitted: publishedMonths.reduce((total, month) => total + (month.assignmentsSubmitted ?? 0), 0),
      quizzesSubmitted: publishedMonths.reduce((total, month) => total + (month.quizzesSubmitted ?? 0), 0),
      examsSubmitted: publishedMonths.reduce((total, month) => total + (month.examsSubmitted ?? 0), 0),
      missingCount: publishedMonths.reduce((total, month) => total + (month.missingCount ?? 0), 0),
      lateCount: publishedMonths.reduce((total, month) => total + (month.lateCount ?? 0), 0),
    },
    trend: buildTrend(monthlyBreakdown),
    monthlyBreakdown,
  };
}

export async function generateCombinedReportSnapshot(input: {
  studentId: string;
  fromMonth: string;
  toMonth: string;
  adminId: string;
}): Promise<{ snapshot: CombinedReportSnapshot; alreadyExists: boolean }> {
  const periods = selectedCombinedReportPeriods(input.fromMonth, input.toMonth);
  const ref = getFirebaseAdminDb()
    .collection(combinedReportsCollection)
    .doc(combinedReportDocumentId(input.studentId, input.fromMonth, input.toMonth));
  const existing = await ref.get();

  if (existing.exists) {
    return { snapshot: toCombinedSnapshot(existing.id, existing.data() ?? {}), alreadyExists: true };
  }

  const [student, monthlySnapshots] = await Promise.all([
    getStudentProfile(input.studentId),
    listPublishedMonthlySnapshots(input.studentId, periods),
  ]);

  if (monthlySnapshots.length === 0) {
    throw new Error("No published reports are available for this student in the selected period.");
  }

  const report = buildCombinedReport({
    student,
    fromMonth: input.fromMonth,
    toMonth: input.toMonth,
    periods,
    monthlySnapshots,
  });
  const nowIso = Timestamp.now().toDate().toISOString();
  const record = {
    studentId: input.studentId,
    fromMonth: input.fromMonth,
    toMonth: input.toMonth,
    periods,
    publishedPeriods: report.publishedPeriods,
    missingPeriods: report.missingPeriods,
    status: "draft" as const,
    report: toStorableReport(report),
    generatedAt: nowIso,
    generatedBy: input.adminId,
    publishedAt: null,
    publishedBy: null,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await ref.create(record);
  } catch {
    const raced = await ref.get();

    if (raced.exists) {
      return { snapshot: toCombinedSnapshot(raced.id, raced.data() ?? {}), alreadyExists: true };
    }

    throw new Error("The combined report draft could not be generated. Try again in a moment.");
  }

  const saved = await ref.get();

  return { snapshot: toCombinedSnapshot(saved.id, saved.data() ?? record), alreadyExists: false };
}

export async function getCombinedReportStatus(input: {
  studentId: string;
  fromMonth: string;
  toMonth: string;
}) {
  selectedCombinedReportPeriods(input.fromMonth, input.toMonth);
  await getStudentProfile(input.studentId);

  const ref = getFirebaseAdminDb()
    .collection(combinedReportsCollection)
    .doc(combinedReportDocumentId(input.studentId, input.fromMonth, input.toMonth));
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return {
      status: "not_generated" as const,
      fromMonth: input.fromMonth,
      toMonth: input.toMonth,
    };
  }

  return {
    status: toCombinedSnapshot(snapshot.id, snapshot.data() ?? {}).status,
    snapshot: toCombinedSnapshot(snapshot.id, snapshot.data() ?? {}),
  };
}

export async function getAdminCombinedReport(reportId: string) {
  const snapshot = await getFirebaseAdminDb().collection(combinedReportsCollection).doc(reportId).get();

  if (!snapshot.exists) {
    throw new Error("Combined report was not found.");
  }

  return toCombinedSnapshot(snapshot.id, snapshot.data() ?? {});
}

export async function publishCombinedReport(input: { reportId: string; adminId: string }) {
  const db = getFirebaseAdminDb();
  const ref = db.collection(combinedReportsCollection).doc(input.reportId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Combined report was not found.");
  }

  const report = toCombinedSnapshot(snapshot.id, snapshot.data() ?? {});

  if (report.status === "published") {
    return { snapshot: report, alreadyPublished: true };
  }

  await ref.update({
    status: "published",
    publishedAt: FieldValue.serverTimestamp(),
    publishedBy: input.adminId,
  });

  await createNotification({
    studentId: report.studentId,
    type: "monthly_report",
    title: `Your ${formatReportRangeLabel(report.fromMonth, report.toMonth)} report is ready`,
    message: `Your progress report for ${formatReportRangeMessage(report.fromMonth, report.toMonth)} is now available. Check it out.`,
    link: "/reports",
    relatedId: `combined:${report.id}`,
  });

  const updated = await ref.get();

  return {
    snapshot: toCombinedSnapshot(updated.id, updated.data() ?? {}),
    alreadyPublished: false,
  };
}

export async function deleteCombinedReportDraft(reportId: string) {
  const ref = getFirebaseAdminDb().collection(combinedReportsCollection).doc(reportId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return { deleted: false };
  }

  const report = toCombinedSnapshot(snapshot.id, snapshot.data() ?? {});

  if (report.status === "published") {
    throw new Error("Published combined reports cannot be deleted as drafts.");
  }

  await ref.delete();

  return { deleted: true };
}

export async function listPublishedCombinedReports(studentId: string) {
  const snapshot = await getFirebaseAdminDb()
    .collection(combinedReportsCollection)
    .where("studentId", "==", studentId)
    .where("status", "==", "published")
    .get();

  return snapshot.docs
    .map((doc) => toCombinedSnapshot(doc.id, doc.data()))
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    })
    .map(toSummary);
}

export async function getPublishedCombinedReport(studentId: string, reportId: string) {
  const snapshot = await getFirebaseAdminDb().collection(combinedReportsCollection).doc(reportId).get();

  if (!snapshot.exists) {
    return null;
  }

  const report = toCombinedSnapshot(snapshot.id, snapshot.data() ?? {});

  if (report.studentId !== studentId || report.status !== "published") {
    return null;
  }

  return report;
}

export function formatReportRangeLabel(fromMonth: string, toMonth: string) {
  if (fromMonth === toMonth) {
    return formatReportPeriodLabel(fromMonth);
  }

  return `${formatReportPeriodLabel(fromMonth)}-${formatReportPeriodLabel(toMonth)}`;
}

export function formatReportRangeMessage(fromMonth: string, toMonth: string) {
  if (fromMonth === toMonth) {
    return formatReportPeriodLabel(fromMonth);
  }

  return `${formatReportPeriodLabel(fromMonth)} to ${formatReportPeriodLabel(toMonth)}`;
}
