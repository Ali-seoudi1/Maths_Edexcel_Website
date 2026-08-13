import { NextResponse } from "next/server";

import { getExamById, getServerNowIso } from "@/features/exams/services/server-exam-service";
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
    const exam = await getExamById(id, { publishedOnly: true });

    if (!exam) {
      return NextResponse.json({ error: "Exam was not found." }, { status: 404 });
    }

    return NextResponse.json({ exam, serverNow: getServerNowIso() });
  } catch (error) {
    console.error("[exam] failed to load student exam", error);
    return errorResponse(error, "Exam request failed.");
  }
}
