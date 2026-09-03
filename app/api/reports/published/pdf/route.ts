import { NextResponse } from "next/server";

import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
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
    const user = await requireActiveUser(request);
    const month = new URL(request.url).searchParams.get("month")?.trim();

    if (!month) {
      return NextResponse.json({ error: "Month is required." }, { status: 422 });
    }

    const snapshot = await getPublishedReportSnapshot(user.uid, month);

    if (!snapshot) {
      return NextResponse.json({ error: "This report has not been published yet." }, { status: 404 });
    }

    const student = await getReportPdfStudent(user.uid);
    const buffer = await renderMonthlyReportPdfBuffer(snapshot, student);

    return pdfResponse(buffer, monthlyReportPdfFileName(snapshot, student));
  } catch (error) {
    return errorResponse(error, "Report PDF request failed.");
  }
}
