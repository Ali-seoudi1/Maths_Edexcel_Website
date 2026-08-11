import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { quizGradePayloadSchema } from "@/features/quizzes/schemas";
import { gradeQuizSubmission } from "@/features/quizzes/services/server-quiz-service";
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
    const payload = quizGradePayloadSchema.parse(await request.json());
    const submission = await gradeQuizSubmission(id, submissionId, payload, admin.uid);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[quiz] failed to grade quiz submission", error);
    return errorResponse(error, "Quiz grading request failed.");
  }
}
