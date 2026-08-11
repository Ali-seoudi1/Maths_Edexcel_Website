import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { getAdminQuizPdfBuffer } from "@/features/quizzes/services/server-quiz-service";
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
    const pdfId = new URL(request.url).searchParams.get("pdfId");
    const pdf = await getAdminQuizPdfBuffer(id, pdfId);

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
    console.error("[quiz] failed to stream admin quiz PDF", error);
    return errorResponse(error, "Quiz PDF request failed.");
  }
}
