import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { examPayloadSchema } from "@/features/exams/schemas";
import { createExam, listExams } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const exams = await listExams();

    return NextResponse.json({ exams });
  } catch (error) {
    return errorResponse(error, "Exam request failed.");
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
    const pdfFileValues = formData.getAll("pdfs");
    const pdfFiles = pdfFileValues.filter((file): file is File => file instanceof File);

    if (pdfFiles.length !== pdfFileValues.length) {
      throw new Error("Upload exam PDFs.");
    }

    const values = examPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes") ?? 0),
      maxScore: Number(formData.get("maxScore") ?? 100),
      published: formData.get("published") === "true",
      scheduledAt: String(formData.get("scheduledAt") ?? "") || null,
    });

    const exam = await createExam(values, pdfFiles, admin.uid);

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("[exam] failed to create exam", error);
    return errorResponse(error, "Exam request failed.");
  }
}
