import { NextResponse } from "next/server";

import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";
import {
  combinedReportPdfFileName,
  renderCombinedReportPdfBuffer,
} from "@/features/reports/pdf/render-report-pdf";
import { pdfResponse } from "@/features/reports/pdf/report-pdf-utils";
import { getPublishedCombinedReport } from "@/features/reports/services/combined-report-service";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const snapshot = await getPublishedCombinedReport(user.uid, id);

    if (!snapshot) {
      return NextResponse.json({ error: "This combined report has not been published yet." }, { status: 404 });
    }

    const buffer = await renderCombinedReportPdfBuffer(snapshot);

    return pdfResponse(buffer, combinedReportPdfFileName(snapshot));
  } catch (error) {
    return errorResponse(error, "Combined report PDF request failed.");
  }
}
