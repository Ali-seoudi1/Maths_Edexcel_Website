import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { chapterPayloadSchema } from "@/features/lessons/schemas";
import {
  deleteChapter,
  getChapterById,
  updateChapter,
} from "@/features/lessons/services/server-lesson-service";
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
    const chapter = await getChapterById(id);

    if (!chapter) {
      return NextResponse.json({ error: "Topic was not found." }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error) {
    return errorResponse(error, "Topic request failed.");
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
    const values = chapterPayloadSchema.parse(await request.json());
    const chapter = await updateChapter(id, values);

    return NextResponse.json({ chapter });
  } catch (error) {
    return errorResponse(error, "Topic request failed.");
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
    const result = await deleteChapter(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Topic request failed.");
  }
}
