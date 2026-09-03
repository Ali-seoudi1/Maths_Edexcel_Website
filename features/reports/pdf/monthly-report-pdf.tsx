import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { MonthlyReport, MonthlyReportSnapshot } from "../types";
import { reportPdfStyles as styles } from "./report-pdf-styles";
import {
  formatItemType,
  formatPdfDate,
  formatPdfPeriod,
  formatPdfScore,
  type ReportPdfStudent,
} from "./report-pdf-utils";

type MonthlyReportPdfDocumentProps = {
  snapshot: MonthlyReportSnapshot;
  student: ReportPdfStudent;
};

type MonthlyReportPdfSectionProps = {
  report: MonthlyReport;
  title?: string;
};

function statusLabel(status: MonthlyReport["items"][number]["status"]) {
  if (status === "on-time") return "On time";
  if (status === "late") return "Late";
  if (status === "opened") return "Opened";
  if (status === "graded") return "Graded";
  if (status === "no-submission") return "No submission";
  return "Submitted";
}

export function MonthlyReportPdfSection({ report, title = "Monthly Snapshot" }: MonthlyReportPdfSectionProps) {
  return (
    <View style={styles.pageSection}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.compactGrid}>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{report.totals.assignmentsSubmitted}</Text>
          <Text style={styles.metricLabel}>Assignments</Text>
          <Text style={styles.detailMeta}>Submitted</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{report.totals.quizzesSubmitted}</Text>
          <Text style={styles.metricLabel}>Quizzes & Exams</Text>
          <Text style={styles.detailMeta}>Submitted</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{report.totals.lateSubmissions}</Text>
          <Text style={styles.metricLabel}>Late</Text>
          <Text style={styles.detailMeta}>Needs improvement</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.metricValue}>{report.totals.noSubmissions}</Text>
          <Text style={styles.metricLabel}>Missing</Text>
          <Text style={styles.detailMeta}>No submission</Text>
        </View>
      </View>

      {report.items.length > 0 ? (
        <View>
          {report.items.map((item) => (
            <View key={`${item.type}-${item.id}`} style={styles.detailCard} wrap={false}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{item.title}</Text>
                <Text style={styles.detailMeta}>{statusLabel(item.status)}</Text>
              </View>
              <View style={styles.twoColumn}>
                <Text style={[styles.detailMeta, { width: "24%" }]}>Type: {formatItemType(item.type)}</Text>
                <Text style={[styles.detailMeta, { width: "32%" }]}>Submitted: {formatPdfDate(item.submittedAt)}</Text>
                <Text style={[styles.detailMeta, { width: "20%" }]}>Score: {formatPdfScore(item.score, item.maxScore)}</Text>
                <Text style={[styles.detailMeta, { width: "24%" }]}>
                  Files: {item.files?.length ? item.files.map((file) => file.fileName).join(", ") : "None"}
                </Text>
              </View>
              {item.feedback ? <Text style={styles.detailText}>Feedback: {item.feedback}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.detailCard}>
          <Text style={styles.detailText}>No activity was recorded for this month.</Text>
        </View>
      )}
    </View>
  );
}

export function MonthlyReportPdfDocument({ snapshot, student }: MonthlyReportPdfDocumentProps) {
  const report = snapshot.report;

  return (
    <Document title={`${formatPdfPeriod(snapshot.period)} Progress Report`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Official Monthly Report</Text>
          <Text style={styles.title}>{formatPdfPeriod(snapshot.period)} Progress Report</Text>
          <Text style={styles.subtitle}>
            Omar El Adawy - Edexcel IGCSE Mathematics | Report date {formatPdfDate(snapshot.publishedAt)}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.metricLabel}>Student</Text>
            <Text style={styles.metricValue}>{student.fullName}</Text>
            <Text style={styles.subtitle}>{student.email}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricLabel}>Student ID</Text>
            <Text style={styles.metricValue}>{student.studentCode}</Text>
          </View>
        </View>

        <MonthlyReportPdfSection report={report} title="Activity Snapshot" />

        <Text
          fixed
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
