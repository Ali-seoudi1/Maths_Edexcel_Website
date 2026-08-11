import { NextResponse } from "next/server";

import { submitQuizPdf } from "@/features/quizzes/services/server-quiz-service";
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
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");

    if (!(pdfFile instanceof File)) {
      throw new Error("Upload your answer PDF before submitting.");
    }

    const submission = await submitQuizPdf(id, user.uid, user.role === "admin" ? "Admin" : "Student", pdfFile);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[quiz] failed to submit quiz", error);
    return errorResponse(error, "Quiz request failed.");
  }
}
