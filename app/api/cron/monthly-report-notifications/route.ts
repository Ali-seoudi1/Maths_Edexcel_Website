import { NextResponse } from "next/server";

import { ensureMonthlyReportNotificationsForAllActiveStudents } from "@/features/notifications/services/server-notification-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json({ error: "Cron authentication is not configured." }, { status: 501 });
  }

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  try {
    const result = await ensureMonthlyReportNotificationsForAllActiveStudents();

    return NextResponse.json(result);
  } catch (error) {
    console.error("[notifications] failed to create monthly report notifications", error);
    return errorResponse(error, "Monthly report notification request failed.");
  }
}
