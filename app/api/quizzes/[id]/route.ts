import { NextResponse } from "next/server";

import { getQuizById, getServerNowIso } from "@/features/quizzes/services/server-quiz-service";
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
    await requireActiveUser(request);
    const { id } = await context.params;
    const quiz = await getQuizById(id, { publishedOnly: true });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz was not found." }, { status: 404 });
    }

    return NextResponse.json({ quiz, serverNow: getServerNowIso() });
  } catch (error) {
    console.error("[quiz] failed to load student quiz", error);
    return errorResponse(error, "Quiz request failed.");
  }
}
