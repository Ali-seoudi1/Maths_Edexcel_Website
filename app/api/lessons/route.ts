import { NextResponse } from "next/server";

import { listLessons } from "@/features/lessons/services/server-lesson-service";
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
    await requireActiveUser(request);
    const chapterId = new URL(request.url).searchParams.get("chapterId") ?? undefined;
    const lessons = await listLessons({ publishedOnly: true, chapterId });

    return NextResponse.json({ lessons });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
  }
}
