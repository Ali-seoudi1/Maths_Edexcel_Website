import { NextResponse } from "next/server";

import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";
import { getPublishedCombinedReport } from "@/features/reports/services/combined-report-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const snapshot = await getPublishedCombinedReport(user.uid, id);

    if (!snapshot) {
      return NextResponse.json({ error: "This combined report has not been published yet." }, { status: 404 });
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    return errorResponse(error, "Combined report request failed.");
  }
}
