import { NextResponse } from "next/server";

import { startQuiz } from "@/features/quizzes/services/server-quiz-service";
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
    const submission = await startQuiz(id, user.uid, user.role === "admin" ? "Admin" : "Student");

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("[quiz] failed to start quiz", error);
    return errorResponse(error, "Quiz request failed.");
  }
}
