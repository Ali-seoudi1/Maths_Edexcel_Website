import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  adminSdkUnavailableResponse,
  errorResponse,
} from "@/features/lessons/services/route-helpers";
import {
  monthlyReportPdfFileName,
  renderMonthlyReportPdfBuffer,
} from "@/features/reports/pdf/render-report-pdf";
import {
  getReportPdfStudent,
  pdfResponse,
} from "@/features/reports/pdf/report-pdf-utils";
import { getPublishedReportSnapshot } from "@/features/reports/services/report-snapshot-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const params = new URL(request.url).searchParams;
    const studentId = params.get("studentId")?.trim();
    const month = params.get("month")?.trim();

    if (!studentId || !month) {
      return NextResponse.json({ error: "Student and month are required." }, { status: 422 });
    }

    const snapshot = await getPublishedReportSnapshot(studentId, month);

    if (!snapshot) {
      return NextResponse.json({ error: "This report has not been published yet." }, { status: 404 });
    }

    const student = await getReportPdfStudent(snapshot.studentId);
    const buffer = await renderMonthlyReportPdfBuffer(snapshot, student);

    return pdfResponse(buffer, monthlyReportPdfFileName(snapshot, student));
  } catch (error) {
    return errorResponse(error, "Report PDF request failed.");
  }
}
