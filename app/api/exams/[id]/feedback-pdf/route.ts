import { NextResponse } from "next/server";

import { getReturnedExamFeedbackPdfBuffer } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse, requireActiveUser } from "@/features/lessons/services/route-helpers";

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
    const pdf = await getReturnedExamFeedbackPdfBuffer(id, user.uid);

    if (!pdf) {
      return NextResponse.json({ error: "Corrected exam PDF was not found." }, { status: 404 });
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
    return errorResponse(error, "Corrected exam PDF request failed.");
  }
}
