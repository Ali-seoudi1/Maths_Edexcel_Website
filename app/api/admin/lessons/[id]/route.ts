import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { lessonPayloadSchema } from "@/features/lessons/schemas";
import {
  deleteLesson,
  getLessonById,
  updateLesson,
} from "@/features/lessons/services/server-lesson-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  formDataToLessonPayload,
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
    await requireAdmin(request);
    const { id } = await context.params;
    const lesson = await getLessonById(id);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson was not found." }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const formData = await request.formData();
    const pdfFiles = formData.getAll("pdfs").filter((file): file is File => file instanceof File);
    const values = lessonPayloadSchema.parse(formDataToLessonPayload(formData));
    const lesson = await updateLesson(id, values, admin.uid, pdfFiles);

    return NextResponse.json({ lesson });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
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
    const result = await deleteLesson(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
  }
}
