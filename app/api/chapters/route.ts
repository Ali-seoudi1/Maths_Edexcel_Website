import { NextResponse } from "next/server";

import { listChapters } from "@/features/lessons/services/server-lesson-service";
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
    const chapters = await listChapters({ publishedOnly: true });

    return NextResponse.json({ chapters });
  } catch (error) {
    return errorResponse(error, "Topic request failed.");
  }
}
