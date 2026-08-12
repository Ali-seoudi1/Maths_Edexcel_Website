import { NextResponse } from "next/server";

import {
  generateMonthlyReport,
  getCurrentReportMonth,
} from "@/features/reports/services/server-report-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const month = new URL(request.url).searchParams.get("month") ?? getCurrentReportMonth();
    const report = await generateMonthlyReport(user.uid, month);

    return NextResponse.json({ report });
  } catch (error) {
    return errorResponse(error, "Report request failed.");
  }
}
