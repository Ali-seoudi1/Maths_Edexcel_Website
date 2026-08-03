import { NextResponse } from "next/server";

import { getQuizPdfBuffer } from "@/features/quizzes/services/server-quiz-service";
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
    const pdf = await getQuizPdfBuffer(id);

    if (!pdf) {
      return NextResponse.json({ error: "Quiz PDF was not found." }, { status: 404 });
    }

    return new Response(new Uint8Array(pdf.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdf.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error, "Quiz PDF request failed.");
  }
}
