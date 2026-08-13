import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { examGradePayloadSchema } from "@/features/exams/schemas";
import { gradeExamSubmission } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const { id, submissionId } = await context.params;
    const payload = examGradePayloadSchema.parse(await request.json());
    const submission = await gradeExamSubmission(id, submissionId, payload, admin.uid);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[exam] failed to grade exam submission", error);
    return errorResponse(error, "Exam grading request failed.");
  }
}
