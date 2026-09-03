import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import {
  generateCombinedReportSnapshot,
  getCombinedReportStatus,
} from "@/features/reports/services/combined-report-service";
import { parseReportPeriod } from "@/features/reports/services/report-snapshot-service";

function readGenerateBody(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("A student and reporting period are required.");
  }

  const data = payload as Record<string, unknown>;
  const studentId = typeof data.studentId === "string" ? data.studentId.trim() : "";
  const fromMonth = typeof data.fromMonth === "string" ? data.fromMonth.trim() : "";
  const toMonth = typeof data.toMonth === "string" ? data.toMonth.trim() : "";

  if (!studentId) {
    throw new Error("Select a student.");
  }

  parseReportPeriod(fromMonth);
  parseReportPeriod(toMonth);

  return { studentId, fromMonth, toMonth };
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const admin = await requireAdmin(request);
    const body = readGenerateBody(await request.json());
    const { snapshot, alreadyExists } = await generateCombinedReportSnapshot({
      ...body,
      adminId: admin.uid,
    });

    return NextResponse.json({ snapshot, alreadyExists }, { status: alreadyExists ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, "Combined report generation failed.");
  }
}

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")?.trim() ?? "";
    const fromMonth = searchParams.get("fromMonth")?.trim() ?? "";
    const toMonth = searchParams.get("toMonth")?.trim() ?? "";

    if (!studentId) {
      throw new Error("Select a student.");
    }

    parseReportPeriod(fromMonth);
    parseReportPeriod(toMonth);

    const result = await getCombinedReportStatus({ studentId, fromMonth, toMonth });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Combined report status request failed.");
  }
}
