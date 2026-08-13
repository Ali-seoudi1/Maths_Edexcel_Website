import { NextResponse } from "next/server";

import { submitExamPdf } from "@/features/exams/services/server-exam-service";
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

export async function POST(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");

    if (!(pdfFile instanceof File)) {
      throw new Error("Upload your answer PDF before submitting.");
    }

    const submission = await submitExamPdf(id, user.uid, user.role === "admin" ? "Admin" : "Student", pdfFile);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[exam] failed to submit exam", error);
    return errorResponse(error, "Exam request failed.");
  }
}
