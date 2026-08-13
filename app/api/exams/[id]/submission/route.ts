import { NextResponse } from "next/server";

import {
  getStudentExamAttempt,
  getStudentExamSubmission,
} from "@/features/exams/services/server-exam-service";
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

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const attempt = await getStudentExamAttempt(id, user.uid);
    const submission = await getStudentExamSubmission(id, user.uid);

    return NextResponse.json({ attempt, submission });
  } catch (error) {
    return errorResponse(error, "Exam request failed.");
  }
}
