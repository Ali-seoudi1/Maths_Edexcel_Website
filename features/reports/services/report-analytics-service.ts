import { getFirebaseAdminDb } from "@/lib/firebase/admin";

import {
  monthlyReportsCollection,
  parseReportPeriod,
  reportPeriodFloor,
} from "./report-snapshot-service";
import type {
  MonthlyReport,
  MonthlyReportItem,
  ReportAnalyticsResult,
  ReportAnalyticsStudent,
  ReportAnalyticsStudentSnapshot,
  ReportTrendStatus,
} from "../types";

const stableTrendThreshold = 3;
const lowPerformanceThreshold = 65;
const lowCompletionThreshold = 70;
const maxAcceptableMissing = 3;
const maxAcceptableLate = 3;

type StudentProfile = {
  studentId: string;
  studentName: string;
  studentCode: string;
};

type SnapshotRecord = {
  studentId: string;
  period: string;
  report: MonthlyReport;
};

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

function selectedPeriods(fromMonth: string, toMonth: string) {
  parseReportPeriod(fromMonth);
  parseReportPeriod(toMonth);

  if (fromMonth > toMonth) {
    throw new Error("From month must be before or the same as To month.");
  }

  const periods = [fromMonth];

  while (periods[periods.length - 1] < toMonth) {
    const next = nextPeriod(periods[periods.length - 1]);
    periods.push(next);
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

function trendSummary(snapshots: ReportAnalyticsStudentSnapshot[]) {
  const comparable = snapshots.filter((snapshot) => typeof snapshot.performancePercent === "number");

  if (comparable.length < 2) {
    return {
      delta: null,
      start: null,
      end: null,
    };
  }

  const start = comparable[0];
  const end = comparable[comparable.length - 1];

  return {
    delta: roundPercent((end.performancePercent ?? 0) - (start.performancePercent ?? 0)),
    start,
    end,
  };
}

function attentionReasons(student: Omit<ReportAnalyticsStudent, "rank" | "attentionReasons">) {
  const reasons: string[] = [];

  if (typeof student.averagePerformance === "number" && student.averagePerformance < lowPerformanceThreshold) {
    reasons.push("Low performance");
  }

  if (typeof student.completionPercent === "number" && student.completionPercent < lowCompletionThreshold) {
    reasons.push("Low completion");
  }

  if (student.missingCount > maxAcceptableMissing) {
    reasons.push("High missing work");
  }

  if (student.lateCount > maxAcceptableLate) {
    reasons.push("High late submissions");
  }

  if (student.trend === "declining") {
    reasons.push("Declining performance");
  }

  return reasons;
}

function compareStudents(a: ReportAnalyticsStudent, b: ReportAnalyticsStudent) {
  const aAverage = a.averagePerformance ?? -1;
  const bAverage = b.averagePerformance ?? -1;

  if (bAverage !== aAverage) return bAverage - aAverage;

  const aCompletion = a.completionPercent ?? -1;
  const bCompletion = b.completionPercent ?? -1;

  if (bCompletion !== aCompletion) return bCompletion - aCompletion;

  const aOnTime = a.onTimePercent ?? -1;
  const bOnTime = b.onTimePercent ?? -1;

  if (bOnTime !== aOnTime) return bOnTime - aOnTime;

  return a.studentName.localeCompare(b.studentName);
}

function toSnapshotRecord(data: FirebaseFirestore.DocumentData): SnapshotRecord | null {
  if (data.status !== "published" || typeof data.studentId !== "string" || typeof data.period !== "string") {
    return null;
  }

  if (!data.report || typeof data.report !== "object") {
    return null;
  }

  return {
    studentId: data.studentId,
    period: data.period,
    report: data.report as MonthlyReport,
  };
}

async function listStudentProfiles(): Promise<Map<string, StudentProfile>> {
  const snapshot = await getFirebaseAdminDb().collection("users").where("role", "==", "student").get();

  return new Map(
    snapshot.docs.map((doc) => {
      const data = doc.data();

      return [
        doc.id,
        {
          studentId: doc.id,
          studentName: typeof data.fullName === "string" && data.fullName.trim() ? data.fullName : "Student",
          studentCode: typeof data.studentCode === "string" ? data.studentCode : "",
        },
      ];
    }),
  );
}

export async function getAdminReportAnalytics(input: {
  fromMonth: string;
  toMonth: string;
}): Promise<ReportAnalyticsResult> {
  const periods = selectedPeriods(input.fromMonth, input.toMonth);
  const [profiles, snapshotQueries] = await Promise.all([
    listStudentProfiles(),
    Promise.all(
      chunks(periods, 30).map((periodChunk) =>
        getFirebaseAdminDb()
          .collection(monthlyReportsCollection)
          .where("period", "in", periodChunk)
          .get(),
      ),
    ),
  ]);

  const snapshots = snapshotQueries
    .flatMap((query) => query.docs)
    .map((doc) => toSnapshotRecord(doc.data()))
    .filter((snapshot): snapshot is SnapshotRecord => Boolean(snapshot));
  const publishedPeriods = Array.from(new Set(snapshots.map((snapshot) => snapshot.period))).sort();
  const periodsWithoutReports = periods.filter((period) => !publishedPeriods.includes(period));
  const grouped = new Map<string, SnapshotRecord[]>();

  snapshots.forEach((snapshot) => {
    grouped.set(snapshot.studentId, [...(grouped.get(snapshot.studentId) ?? []), snapshot]);
  });

  const students = Array.from(grouped.entries())
    .map(([studentId, records]) => {
      const profile = profiles.get(studentId);
      const orderedRecords = records.sort((a, b) => a.period.localeCompare(b.period));
      const studentSnapshots: ReportAnalyticsStudentSnapshot[] = orderedRecords.map((record) => ({
        period: record.period,
        report: record.report,
        performancePercent: reportPerformancePercent(record.report),
        completionPercent: reportCompletionPercent(record.report),
        onTimePercent: reportOnTimePercent(record.report),
      }));
      const trend = trendSummary(studentSnapshots);
      const studentBase = {
        studentId,
        studentName: profile?.studentName ?? "Student",
        studentCode: profile?.studentCode ?? "",
        averagePerformance: roundPercent(average(studentSnapshots.map((snapshot) => snapshot.performancePercent))),
        completionPercent: roundPercent(average(studentSnapshots.map((snapshot) => snapshot.completionPercent))),
        onTimePercent: roundPercent(average(studentSnapshots.map((snapshot) => snapshot.onTimePercent))),
        missingCount: orderedRecords.reduce((total, record) => total + record.report.totals.noSubmissions, 0),
        lateCount: orderedRecords.reduce((total, record) => total + record.report.totals.lateSubmissions, 0),
        trend: classifyTrend(trend.delta),
        trendDelta: trend.delta,
        trendStart: trend.start,
        trendEnd: trend.end,
        snapshots: studentSnapshots,
      };

      return {
        rank: 0,
        ...studentBase,
        attentionReasons: attentionReasons(studentBase),
      };
    })
    .sort(compareStudents)
    .map((student, index) => ({ ...student, rank: index + 1 }));

  const comparableStudents = students.filter((student) => typeof student.trendDelta === "number");
  const mostImproved =
    comparableStudents.length > 0
      ? [...comparableStudents].sort((a, b) => (b.trendDelta ?? 0) - (a.trendDelta ?? 0))[0]
      : null;

  return {
    fromMonth: input.fromMonth,
    toMonth: input.toMonth,
    periods,
    publishedPeriods,
    periodsWithoutReports,
    studentsWithReports: students.length,
    classAveragePerformance: roundPercent(average(students.map((student) => student.averagePerformance))),
    averageCompletion: roundPercent(average(students.map((student) => student.completionPercent))),
    averageOnTime: roundPercent(average(students.map((student) => student.onTimePercent))),
    highestPerformer: students[0] ?? null,
    mostImproved,
    studentsNeedingAttention: students.filter((student) => student.attentionReasons.length > 0),
    students,
  };
}
