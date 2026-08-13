import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { getSubmissionPdfBuffer } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

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
    const pdf = await getSubmissionPdfBuffer(id, submissionId);

    if (!pdf) {
      return Response.json({ error: "Submission PDF was not found." }, { status: 404 });
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
    console.error("[exam] failed to stream submission PDF", error);
    return errorResponse(error, "Exam submission PDF request failed.");
  }
}
