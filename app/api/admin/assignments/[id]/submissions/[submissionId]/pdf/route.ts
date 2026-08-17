import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { getSubmissionPdfBufferForAdmin } from "@/features/assignments/services/server-assignment-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
} from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const { id, submissionId } = await context.params;
    const pdfId = new URL(request.url).searchParams.get("pdfId") ?? undefined;
    const pdf = await getSubmissionPdfBufferForAdmin(id, submissionId, pdfId);

    if (!pdf) {
      return NextResponse.json({ error: "Submission PDF was not found." }, { status: 404 });
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
    return errorResponse(error, "Submission PDF request failed.");
  }
}
