import { NextResponse } from "next/server";

import { submitQuizAnswers } from "@/features/quizzes/services/server-quiz-service";
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
    const payload = (await request.json()) as { answers?: Record<string, number> };

    if (!payload.answers || typeof payload.answers !== "object") {
      throw new Error("Choose at least one answer before submitting.");
    }

    const submission = await submitQuizAnswers(id, user.uid, payload.answers);

    return NextResponse.json({ submission });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}
