import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  adminSdkUnavailableResponse,
  errorResponse,
} from "@/features/lessons/services/route-helpers";
import {
  combinedReportPdfFileName,
  renderCombinedReportPdfBuffer,
} from "@/features/reports/pdf/render-report-pdf";
import { pdfResponse } from "@/features/reports/pdf/report-pdf-utils";
import { getAdminCombinedReport } from "@/features/reports/services/combined-report-service";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const snapshot = await getAdminCombinedReport(id);

    if (snapshot.status !== "published") {
      return NextResponse.json({ error: "This combined report has not been published yet." }, { status: 404 });
    }

    const buffer = await renderCombinedReportPdfBuffer(snapshot);

    return pdfResponse(buffer, combinedReportPdfFileName(snapshot));
  } catch (error) {
    return errorResponse(error, "Combined report PDF request failed.");
  }
}
