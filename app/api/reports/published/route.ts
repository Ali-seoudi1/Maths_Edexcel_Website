import { NextResponse } from "next/server";

import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";
import {
  getPublishedReportSnapshot,
  listPublishedReportSnapshots,
} from "@/features/reports/services/report-snapshot-service";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const month = new URL(request.url).searchParams.get("month")?.trim();

    if (month) {
      const snapshot = await getPublishedReportSnapshot(user.uid, month);

      if (!snapshot) {
        return NextResponse.json({ error: "This report has not been published yet." }, { status: 404 });
      }

      return NextResponse.json({ snapshot });
    }

    const reports = await listPublishedReportSnapshots(user.uid);

    return NextResponse.json({ reports });
  } catch (error) {
    return errorResponse(error, "Report request failed.");
  }
}
