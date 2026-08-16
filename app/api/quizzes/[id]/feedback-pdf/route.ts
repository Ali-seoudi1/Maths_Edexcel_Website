import { NextResponse } from "next/server";

import { adminSdkUnavailableResponse, errorResponse, requireActiveUser } from "@/features/lessons/services/route-helpers";
import { getReturnedQuizFeedbackPdfBuffer } from "@/features/quizzes/services/server-quiz-service";

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
    const pdf = await getReturnedQuizFeedbackPdfBuffer(id, user.uid);

    if (!pdf) {
      return NextResponse.json({ error: "Corrected quiz PDF was not found." }, { status: 404 });
    }

    return new Response(new Uint8Array(pdf.buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error, "Corrected quiz PDF request failed.");
  }
}
