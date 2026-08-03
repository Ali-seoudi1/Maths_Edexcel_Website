import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { quizPayloadSchema } from "@/features/quizzes/schemas";
import { createQuiz, listQuizzes } from "@/features/quizzes/services/server-quiz-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const quizzes = await listQuizzes();

    return NextResponse.json({ quizzes });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");

    if (!(pdfFile instanceof File)) {
      throw new Error("Upload a quiz PDF.");
    }

    const values = quizPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
    });

    const quiz = await createQuiz(values, pdfFile, admin.uid);

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Quiz request failed.");
  }
}
