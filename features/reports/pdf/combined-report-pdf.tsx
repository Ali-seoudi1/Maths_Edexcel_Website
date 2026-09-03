import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { CombinedReportSnapshot } from "../types";
import { MonthlyReportPdfSection } from "./monthly-report-pdf";
import { reportPdfStyles as styles } from "./report-pdf-styles";
import { formatPdfDate, formatPdfPercent, formatPdfPeriod } from "./report-pdf-utils";

type CombinedReportPdfDocumentProps = {
  snapshot: CombinedReportSnapshot;
};

function formatDelta(value: number | null) {
  if (typeof value !== "number") return "Not enough data";
  if (value > 0) return `+${value} percentage points`;
  return `${value} percentage points`;
}

function trendLabel(status: CombinedReportSnapshot["report"]["trend"]["status"]) {
  if (status === "improving") return "Improving";
  if (status === "declining") return "Declining";
  if (status === "stable") return "Stable";
  return "Not enough data";
}

function periodRangeLabel(fromMonth: string, toMonth: string) {
  if (fromMonth === toMonth) {
    return formatPdfPeriod(fromMonth);
  }

  return `${formatPdfPeriod(fromMonth)} to ${formatPdfPeriod(toMonth)}`;
}

export function CombinedReportPdfDocument({ snapshot }: CombinedReportPdfDocumentProps) {
  const report = snapshot.report;
  const trend = report.trend;
  const missingPeriodLabels = report.missingPeriods.map(formatPdfPeriod);

  return (
    <Document title={`${formatPdfPeriod(snapshot.fromMonth)} to ${formatPdfPeriod(snapshot.toMonth)} Combined Report`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Official Combined Report</Text>
          <Text style={styles.title}>
            {periodRangeLabel(snapshot.fromMonth, snapshot.toMonth)}
          </Text>
          <Text style={styles.subtitle}>
            {report.student.fullName} | Edexcel IGCSE Mathematics | Report date {formatPdfDate(snapshot.publishedAt)}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.metricLabel}>Student</Text>
            <Text style={styles.metricValue}>{report.student.fullName}</Text>
            <Text style={styles.subtitle}>{report.student.email}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricLabel}>Student ID</Text>
            <Text style={styles.metricValue}>{report.student.studentCode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporting Period</Text>
          <Text style={styles.detailText}>{periodRangeLabel(report.fromMonth, report.toMonth)}</Text>
          {missingPeriodLabels.length > 0 ? (
            <Text style={styles.muted}>
              Performance data was not available for {missingPeriodLabels.join(", ")}.
            </Text>
          ) : null}
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{formatPdfPercent(report.overallPerformance)}</Text>
            <Text style={styles.metricLabel}>Overall Performance</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{formatPdfPercent(report.completionPercent)}</Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{formatPdfPercent(report.onTimePercent)}</Text>
            <Text style={styles.metricLabel}>On Time</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.metricValue}>{trendLabel(trend.status)}</Text>
            <Text style={styles.metricLabel}>Trend</Text>
            <Text style={styles.detailMeta}>{formatDelta(trend.delta)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Trend</Text>
          {trend.startPeriod && trend.endPeriod ? (
            <View style={styles.compactGrid}>
              <View style={styles.card}>
                <Text style={styles.metricLabel}>Starting Performance</Text>
                <Text style={styles.detailText}>
                  {formatPdfPeriod(trend.startPeriod)} - {formatPdfPercent(trend.startPerformance)}
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.metricLabel}>Ending Performance</Text>
                <Text style={styles.detailText}>
                  {formatPdfPeriod(trend.endPeriod)} - {formatPdfPercent(trend.endPerformance)}
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.metricLabel}>Change</Text>
                <Text style={styles.detailText}>{formatDelta(trend.delta)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.detailCard}>
              <Text style={styles.detailText}>At least two available months are needed.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.th, { width: "22%" }]}>Month</Text>
              <Text style={[styles.cell, styles.th, { width: "16%" }]}>Performance</Text>
              <Text style={[styles.cell, styles.th, { width: "16%" }]}>Completion</Text>
              <Text style={[styles.cell, styles.th, { width: "16%" }]}>On Time</Text>
              <Text style={[styles.cell, styles.th, { width: "10%" }]}>Missing</Text>
              <Text style={[styles.cell, styles.th, { width: "10%" }]}>Late</Text>
              <Text style={[styles.cell, styles.th, { width: "10%" }]}>Notes</Text>
            </View>
            {report.monthlyBreakdown.map((month, index) => (
              <View
                key={month.period}
                style={[styles.row, index === report.monthlyBreakdown.length - 1 ? { borderBottom: 0 } : undefined]}
              >
                <Text style={[styles.cell, { width: "22%" }]}>{formatPdfPeriod(month.period)}</Text>
                <Text style={[styles.cell, { width: "16%" }]}>{formatPdfPercent(month.performancePercent)}</Text>
                <Text style={[styles.cell, { width: "16%" }]}>{formatPdfPercent(month.completionPercent)}</Text>
                <Text style={[styles.cell, { width: "16%" }]}>{formatPdfPercent(month.onTimePercent)}</Text>
                <Text style={[styles.cell, { width: "10%" }]}>
                  {typeof month.missingCount === "number" ? month.missingCount : "N/A"}
                </Text>
                <Text style={[styles.cell, { width: "10%" }]}>
                  {typeof month.lateCount === "number" ? month.lateCount : "N/A"}
                </Text>
                <Text style={[styles.cell, { width: "10%" }]}>
                  {month.status === "published" ? "Available" : "Not available"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.metricValue}>{report.totals.assignmentsSubmitted}</Text>
              <Text style={styles.metricLabel}>Assignments</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.metricValue}>{report.totals.quizzesSubmitted}</Text>
              <Text style={styles.metricLabel}>Quizzes</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.metricValue}>{report.totals.examsSubmitted}</Text>
              <Text style={styles.metricLabel}>Exams</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.metricValue}>{report.totals.lateCount}</Text>
              <Text style={styles.metricLabel}>Late Items</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.metricValue}>{report.totals.missingCount}</Text>
              <Text style={styles.metricLabel}>Missing Work</Text>
            </View>
          </View>
        </View>

        <View style={styles.pageSection}>
          <Text style={styles.sectionTitle}>Monthly Report Details</Text>
          <Text style={styles.muted}>
            Monthly activity details included in this combined report.
          </Text>
          {report.monthlyBreakdown.filter((month) => month.report).length > 0 ? (
            report.monthlyBreakdown.map((month) =>
              month.report ? (
                <MonthlyReportPdfSection
                  key={month.period}
                  report={month.report}
                  title={formatPdfPeriod(month.period)}
                />
              ) : null,
            )
          ) : (
            <View style={styles.detailCard}>
              <Text style={styles.detailText}>No monthly activity details are available.</Text>
            </View>
          )}
        </View>

        <Text
          fixed
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
