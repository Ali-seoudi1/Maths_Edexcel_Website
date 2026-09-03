import { NextResponse } from "next/server";

import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";
import { listPublishedCombinedReports } from "@/features/reports/services/combined-report-service";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const reports = await listPublishedCombinedReports(user.uid);

    return NextResponse.json({ reports });
  } catch (error) {
    return errorResponse(error, "Combined reports request failed.");
  }
}
