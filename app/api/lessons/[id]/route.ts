import { NextResponse } from "next/server";

import { getLessonById } from "@/features/lessons/services/server-lesson-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
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
    await requireActiveUser(request);
    const { id } = await context.params;
    const lesson = await getLessonById(id, { publishedOnly: true });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson was not found." }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    return errorResponse(error, "Lesson request failed.");
  }
}
