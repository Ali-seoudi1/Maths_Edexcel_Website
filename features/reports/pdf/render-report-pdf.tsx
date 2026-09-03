import { renderToBuffer } from "@react-pdf/renderer";

import type { CombinedReportSnapshot, MonthlyReportSnapshot } from "../types";
import { CombinedReportPdfDocument } from "./combined-report-pdf";
import { MonthlyReportPdfDocument } from "./monthly-report-pdf";
import type { ReportPdfStudent } from "./report-pdf-utils";

export function monthlyReportPdfFileName(snapshot: MonthlyReportSnapshot, student: ReportPdfStudent) {
  return `${student.fullName}-${snapshot.period}-monthly-report.pdf`;
}

export function combinedReportPdfFileName(snapshot: CombinedReportSnapshot) {
  return `${snapshot.report.student.fullName}-${snapshot.fromMonth}-to-${snapshot.toMonth}-combined-report.pdf`;
}

export async function renderMonthlyReportPdfBuffer(snapshot: MonthlyReportSnapshot, student: ReportPdfStudent) {
  return renderToBuffer(<MonthlyReportPdfDocument snapshot={snapshot} student={student} />);
}

export async function renderCombinedReportPdfBuffer(snapshot: CombinedReportSnapshot) {
  return renderToBuffer(<CombinedReportPdfDocument snapshot={snapshot} />);
}
