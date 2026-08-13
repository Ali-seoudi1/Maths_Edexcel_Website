import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { listExamSubmissions } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const submissions = await listExamSubmissions(id);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[exam] failed to list exam submissions", error);
    return errorResponse(error, "Exam submission request failed.");
  }
}
