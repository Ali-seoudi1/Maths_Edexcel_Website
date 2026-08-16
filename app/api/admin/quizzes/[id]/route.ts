import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { quizPayloadSchema } from "@/features/quizzes/schemas";
import {
  deleteQuiz,
  getQuizById,
  getServerNowIso,
  updateQuiz,
} from "@/features/quizzes/services/server-quiz-service";
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

    return NextResponse.json({ quiz, serverNow: getServerNowIso() });
  } catch (error) {
    console.error("[quiz] failed to load admin quiz", error);
    return errorResponse(error, "Quiz request failed.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const formData = await request.formData();
    const pdfFileValues = formData.getAll("pdfs");
    const pdfFiles = pdfFileValues.filter((file): file is File => file instanceof File);
    const removedPdfIds = formData.getAll("removedPdfIds").map((value) => String(value));

    if (pdfFiles.length !== pdfFileValues.length) {
      throw new Error("Upload quiz PDFs.");
    }

    const values = quizPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      maxScore: Number(formData.get("maxScore") ?? 100),
      published: formData.get("published") === "true",
      scheduledAt: String(formData.get("scheduledAt") ?? "") || null,
    });

    const quiz = await updateQuiz(id, values, pdfFiles, removedPdfIds);

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("[quiz] failed to update quiz", error);
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
    console.error("[quiz] failed to delete quiz", error);
    return errorResponse(error, "Quiz request failed.");
  }
}
