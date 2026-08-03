import { NextResponse } from "next/server";

import { submitAssignmentSolution } from "@/features/assignments/services/server-assignment-service";
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
      throw new Error("Upload a PDF solution.");
    }

    const submission = await submitAssignmentSolution(id, user.uid, user.role === "admin" ? "Admin" : "Student", pdfFile);

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
