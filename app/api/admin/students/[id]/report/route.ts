import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { getFirebaseAdminDb, getMissingFirebaseAdminEnv } from "@/lib/firebase/admin";
import {
  generateMonthlyReport,
  getCurrentReportMonth,
} from "@/features/reports/services/server-report-service";

type StudentReportRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Student report request failed." },
    { status: 400 },
  );
}

export async function GET(request: Request, { params }: StudentReportRouteProps) {
  const missingAdminEnv = getMissingFirebaseAdminEnv();

  if (missingAdminEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Firebase Admin SDK is not configured. Missing: ${missingAdminEnv.join(", ")}.`,
      },
      { status: 501 },
    );
  }

  try {
    await requireAdmin(request);

    const { id } = await params;
    const studentSnapshot = await getFirebaseAdminDb().collection("users").doc(id).get();
    const student = studentSnapshot.data();

    if (!studentSnapshot.exists || student?.role !== "student") {
      throw new Error("Student account was not found.");
    }

    const month = new URL(request.url).searchParams.get("month") ?? getCurrentReportMonth();
    const report = await generateMonthlyReport(id, month);

    return NextResponse.json({ report });
  } catch (error) {
    return errorResponse(error);
  }
}
