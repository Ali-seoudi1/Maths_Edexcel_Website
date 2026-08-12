import { NextResponse } from "next/server";

import {
  getQuizPdfBuffer,
  getStudentQuizAttempt,
} from "@/features/quizzes/services/server-quiz-service";
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
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const attempt = await getStudentQuizAttempt(id, user.uid);

    if (!attempt) {
      return NextResponse.json({ error: "Open the quiz before viewing its PDFs." }, { status: 403 });
    }

    const pdfId = new URL(request.url).searchParams.get("pdfId");
    const pdf = await getQuizPdfBuffer(id, pdfId);

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
