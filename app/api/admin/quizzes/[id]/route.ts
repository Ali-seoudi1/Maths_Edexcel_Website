import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { deleteQuiz, getQuizById } from "@/features/quizzes/services/server-quiz-service";
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
    const quiz = await getQuizById(id);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz was not found." }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const result = await deleteQuiz(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}
