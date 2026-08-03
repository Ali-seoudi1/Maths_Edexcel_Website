import { NextResponse } from "next/server";

import { getStudentQuizSubmission } from "@/features/quizzes/services/server-quiz-service";
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
    const submission = await getStudentQuizSubmission(id, user.uid);

    return NextResponse.json({ submission });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}
