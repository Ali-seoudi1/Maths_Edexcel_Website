import { NextResponse } from "next/server";

import {
  listQuizzesForStudent,
  listStudentQuizAttempts,
  listStudentQuizSubmissions,
} from "@/features/quizzes/services/server-quiz-service";
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
    const user = await requireActiveUser(request);
    const quizzes = await listQuizzesForStudent(user.uid);
    const [submissions, attempts] = await Promise.all([
      listStudentQuizSubmissions(user.uid),
      listStudentQuizAttempts(user.uid),
    ]);

    return NextResponse.json({ quizzes, submissions, attempts });
  } catch (error) {
    console.error("[quiz] failed to list student quizzes", error);
    return errorResponse(error, "Quiz request failed.");
  }
}
