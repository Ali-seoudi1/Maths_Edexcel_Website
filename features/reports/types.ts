export type MonthlyReportItem = {
  id: string;
  type: "assignment" | "quiz" | "quiz-attempt" | "exam" | "exam-attempt";
  resourceId?: string;
  submissionId?: string;
  title: string;
  submittedAt: string | null;
  status: "on-time" | "late" | "opened" | "graded" | "submitted" | "no-submission";
  score: number | null;
  maxScore: number | null;
  feedback: string;
  files?: {
    id: string;
    fileName: string;
  }[];
};

export type MonthlyReport = {
  month: string;
  generatedAt: string;
  totals: {
    assignmentsSubmitted: number;
    quizzesSubmitted: number;
    quizzesOpened: number;
    lateSubmissions: number;
    onTimeSubmissions: number;
    gradedItems: number;
    noSubmissions: number;
  };
  items: MonthlyReportItem[];
};

/**
 * Status of an official monthly report for a student + period.
 *
 * - `not_generated`: the teacher has never finalized this month. The student
 *   must not see it as an available report.
 * - `published`: the teacher has finalized and published a frozen snapshot.
 */
export type MonthlyReportSnapshotStatus = "not_generated" | "published";
export type AdminMonthlyReportSnapshotStatus = "draft" | "published";

/**
 * An official, teacher-finalized monthly report. The `report` field is a frozen
 * copy of the live {@link MonthlyReport} calculation taken at the exact moment
 * the teacher published it. Later changes to live activity never mutate it.
 */
export type MonthlyReportSnapshot = {
  id: string;
  studentId: string;
  year: number;
  month: number;
  /** `YYYY-MM` for the reported month. */
  period: string;
  status: AdminMonthlyReportSnapshotStatus;
  report: MonthlyReport;
  generatedAt: string | null;
  generatedBy: string;
  publishedAt: string | null;
  publishedBy: string;
};

/** Lightweight list entry for a published monthly report. */
export type MonthlyReportSnapshotSummary = {
  id: string;
  studentId: string;
  year: number;
  month: number;
  period: string;
  status: "published";
  generatedAt: string | null;
  publishedAt: string | null;
};

/** Result of checking whether an official report exists for a student + period. */
export type MonthlyReportStatusResult =
  | { status: "not_generated"; period: string }
  | { status: "draft"; period: string; snapshot: MonthlyReportSnapshot }
  | { status: "published"; period: string; snapshot: MonthlyReportSnapshot };

export type ReportTrendStatus = "improving" | "stable" | "declining" | "not_enough_data";

export type ReportAnalyticsStudentSnapshot = {
  period: string;
  report: MonthlyReport;
  performancePercent: number | null;
  completionPercent: number | null;
  onTimePercent: number | null;
};

export type ReportAnalyticsStudent = {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  averagePerformance: number | null;
  completionPercent: number | null;
  onTimePercent: number | null;
  missingCount: number;
  lateCount: number;
  trend: ReportTrendStatus;
  trendDelta: number | null;
  trendStart: ReportAnalyticsStudentSnapshot | null;
  trendEnd: ReportAnalyticsStudentSnapshot | null;
  attentionReasons: string[];
  snapshots: ReportAnalyticsStudentSnapshot[];
};

export type ReportAnalyticsResult = {
  fromMonth: string;
  toMonth: string;
  periods: string[];
  publishedPeriods: string[];
  periodsWithoutReports: string[];
  studentsWithReports: number;
  classAveragePerformance: number | null;
  averageCompletion: number | null;
  averageOnTime: number | null;
  highestPerformer: ReportAnalyticsStudent | null;
  mostImproved: ReportAnalyticsStudent | null;
  studentsNeedingAttention: ReportAnalyticsStudent[];
  students: ReportAnalyticsStudent[];
};

export type CombinedReportStatus = "draft" | "published";

export type CombinedReportMonthlyBreakdown = {
  period: string;
  status: "published" | "missing";
  performancePercent: number | null;
  completionPercent: number | null;
  onTimePercent: number | null;
  assignmentsSubmitted: number | null;
  quizzesSubmitted: number | null;
  examsSubmitted: number | null;
  missingCount: number | null;
  lateCount: number | null;
  report: MonthlyReport | null;
};

export type CombinedReportTrend = {
  status: ReportTrendStatus;
  delta: number | null;
  startPeriod: string | null;
  startPerformance: number | null;
  endPeriod: string | null;
  endPerformance: number | null;
};

export type CombinedOfficialReport = {
  student: {
    uid: string;
    fullName: string;
    email: string;
    studentCode: string;
  };
  fromMonth: string;
  toMonth: string;
  periods: string[];
  publishedPeriods: string[];
  missingPeriods: string[];
  overallPerformance: number | null;
  completionPercent: number | null;
  onTimePercent: number | null;
  totals: {
    assignmentsSubmitted: number;
    quizzesSubmitted: number;
    examsSubmitted: number;
    missingCount: number;
    lateCount: number;
  };
  trend: CombinedReportTrend;
  monthlyBreakdown: CombinedReportMonthlyBreakdown[];
};

export type CombinedReportSnapshot = {
  id: string;
  studentId: string;
  fromMonth: string;
  toMonth: string;
  periods: string[];
  publishedPeriods: string[];
  missingPeriods: string[];
  status: CombinedReportStatus;
  report: CombinedOfficialReport;
  generatedAt: string | null;
  generatedBy: string;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string | null;
};

export type CombinedReportSummary = {
  id: string;
  studentId: string;
  fromMonth: string;
  toMonth: string;
  periods: string[];
  publishedPeriods: string[];
  missingPeriods: string[];
  status: CombinedReportStatus;
  generatedAt: string | null;
  publishedAt: string | null;
};
