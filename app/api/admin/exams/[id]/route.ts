import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { examPayloadSchema } from "@/features/exams/schemas";
import {
  deleteExam,
  getExamById,
  getServerNowIso,
  updateExam,
} from "@/features/exams/services/server-exam-service";
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
    const exam = await getExamById(id);

    if (!exam) {
      return NextResponse.json({ error: "Exam was not found." }, { status: 404 });
    }

    return NextResponse.json({ exam, serverNow: getServerNowIso() });
  } catch (error) {
    console.error("[exam] failed to load admin exam", error);
    return errorResponse(error, "Exam request failed.");
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
      throw new Error("Upload exam PDFs.");
    }

    const values = examPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      maxScore: Number(formData.get("maxScore") ?? 100),
      published: formData.get("published") === "true",
    });

    const exam = await updateExam(id, values, pdfFiles, removedPdfIds);

    return NextResponse.json({ exam });
  } catch (error) {
    console.error("[exam] failed to update exam", error);
    return errorResponse(error, "Exam request failed.");
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
    const result = await deleteExam(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[exam] failed to delete exam", error);
    return errorResponse(error, "Exam request failed.");
  }
}
