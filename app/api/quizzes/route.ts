import { NextResponse } from "next/server";

import { listQuizzes } from "@/features/quizzes/services/server-quiz-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireActiveUser(request);
    const quizzes = await listQuizzes();

    return NextResponse.json({ quizzes });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}
