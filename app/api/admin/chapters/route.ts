import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { chapterPayloadSchema } from "@/features/lessons/schemas";
import {
  createChapter,
  listChapters,
} from "@/features/lessons/services/server-lesson-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const chapters = await listChapters();

    return NextResponse.json({ chapters });
  } catch (error) {
    return errorResponse(error, "Chapter request failed.");
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const values = chapterPayloadSchema.parse(await request.json());
    const chapter = await createChapter(values);

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Chapter request failed.");
  }
}
