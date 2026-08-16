import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { examGradePayloadSchema } from "@/features/exams/schemas";
import { gradeExamSubmission } from "@/features/exams/services/server-exam-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
    submissionId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const { id, submissionId } = await context.params;
    const contentType = request.headers.get("content-type") ?? "";
    const formData = contentType.includes("multipart/form-data") ? await request.formData() : null;
    const payload = examGradePayloadSchema.parse(
      formData
        ? {
            score: String(formData.get("score") ?? "") === "" ? null : Number(formData.get("score")),
            feedback: String(formData.get("feedback") ?? ""),
            returnFeedback: formData.get("returnFeedback") === "true",
          }
        : await request.json(),
    );
    const correctedPdfValue = formData?.get("correctedPdf");
    const correctedPdf = correctedPdfValue instanceof File ? correctedPdfValue : null;
    const submission = await gradeExamSubmission(id, submissionId, payload, admin.uid, correctedPdf);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[exam] failed to grade exam submission", error);
    return errorResponse(error, "Exam grading request failed.");
  }
}
