import { NextResponse } from "next/server";

import { listPublishedLessonCatalog } from "@/features/lessons/services/server-lesson-service";
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
    const catalog = await listPublishedLessonCatalog();

    return NextResponse.json(catalog);
  } catch (error) {
    return errorResponse(error, "Lesson catalog request failed.");
  }
}
