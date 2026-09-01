import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import { getFirebaseAdminDb } from "@/lib/firebase/admin";
import {
  formatReportPeriodLabel,
  getReportSnapshotStatus,
  parseReportPeriod,
  publishMonthlyReportSnapshot,
} from "@/features/reports/services/report-snapshot-service";

async function assertStudent(studentId: string) {
  const studentSnapshot = await getFirebaseAdminDb().collection("users").doc(studentId).get();

  if (!studentSnapshot.exists || studentSnapshot.data()?.role !== "student") {
    throw new Error("Student account was not found.");
  }
}

function readBody(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("A student and month are required.");
  }

  const data = payload as Record<string, unknown>;
  const studentId = typeof data.studentId === "string" ? data.studentId.trim() : "";
  const month = typeof data.month === "string" ? data.month.trim() : "";

  if (!studentId) {
    throw new Error("Select a student.");
  }

  parseReportPeriod(month);

  return { studentId, month };
}

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId")?.trim() ?? "";
    const month = searchParams.get("month")?.trim() ?? "";

    if (!studentId) {
      throw new Error("Select a student.");
    }

    parseReportPeriod(month);
    await assertStudent(studentId);

    const result = await getReportSnapshotStatus(studentId, month);

    return NextResponse.json({ ...result, periodLabel: formatReportPeriodLabel(month) });
  } catch (error) {
    return errorResponse(error, "Report status request failed.");
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const admin = await requireAdmin(request);
    const { studentId, month } = readBody(await request.json());

    await assertStudent(studentId);

    const { snapshot, alreadyPublished } = await publishMonthlyReportSnapshot({
      studentId,
      period: month,
      adminId: admin.uid,
    });

    if (alreadyPublished) {
      return NextResponse.json(
        {
          error: `The ${formatReportPeriodLabel(month)} report has already been published.`,
          snapshot,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Report publish request failed.");
  }
}
