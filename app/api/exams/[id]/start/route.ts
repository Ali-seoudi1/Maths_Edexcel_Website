import { NextResponse } from "next/server";

import { startExam } from "@/features/exams/services/server-exam-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const result = await startExam(id, user.uid, user.role === "admin" ? "Admin" : "Student");

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[exam] failed to start exam", error);
    return errorResponse(error, "Exam request failed.");
  }
}
