import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { listQuizSubmissions } from "@/features/quizzes/services/server-quiz-service";
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
    const submissions = await listQuizSubmissions(id);

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[quiz] failed to list quiz submissions", error);
    return errorResponse(error, "Quiz submission request failed.");
  }
}
