import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import { getAdminReportAnalytics } from "@/features/reports/services/report-analytics-service";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const fromMonth = searchParams.get("fromMonth")?.trim() ?? "";
    const toMonth = searchParams.get("toMonth")?.trim() ?? fromMonth;
    const analytics = await getAdminReportAnalytics({ fromMonth, toMonth });

    return NextResponse.json({ analytics });
  } catch (error) {
    return errorResponse(error, "Report analytics request failed.");
  }
}
