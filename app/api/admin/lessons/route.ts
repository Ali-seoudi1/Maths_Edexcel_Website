import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { lessonPayloadSchema } from "@/features/lessons/schemas";
import {
  createLesson,
  listLessons,
} from "@/features/lessons/services/server-lesson-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  formDataToLessonPayload,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const chapterId = new URL(request.url).searchParams.get("chapterId") ?? undefined;
    const lessons = await listLessons({ chapterId });

    return NextResponse.json({ lessons });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
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
    const pdfFiles = formData.getAll("pdfs").filter((file): file is File => file instanceof File);

    if (pdfFiles.length === 0) {
      throw new Error("Upload at least one lesson PDF.");
    }

    const values = lessonPayloadSchema.parse(formDataToLessonPayload(formData));
    const lesson = await createLesson(values, pdfFiles, admin.uid);

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
  }
}
