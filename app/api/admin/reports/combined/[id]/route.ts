import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import {
  deleteCombinedReportDraft,
  getAdminCombinedReport,
  publishCombinedReport,
} from "@/features/reports/services/combined-report-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const snapshot = await getAdminCombinedReport(id);

    return NextResponse.json({ snapshot });
  } catch (error) {
    return errorResponse(error, "Combined report request failed.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const payload = (await request.json().catch(() => null)) as unknown;
    const action =
      payload && typeof payload === "object" && "action" in payload
        ? (payload as { action?: unknown }).action
        : null;

    if (action !== "publish") {
      throw new Error("Choose a valid combined report action.");
    }

    const result = await publishCombinedReport({ reportId: id, adminId: admin.uid });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Combined report update failed.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { id } = await context.params;
    const result = await deleteCombinedReportDraft(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Combined report draft delete failed.");
  }
}
