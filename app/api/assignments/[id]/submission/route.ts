import { NextResponse } from "next/server";

import {
  deleteStudentSubmissionPdf,
  deleteStudentSubmission,
  getStudentSubmission,
} from "@/features/assignments/services/server-assignment-service";
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
    const submission = await getStudentSubmission(id, user.uid);

    return NextResponse.json({ submission });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const pdfId = new URL(request.url).searchParams.get("pdfId");
    const result = pdfId
      ? await deleteStudentSubmissionPdf(id, user.uid, pdfId)
      : await deleteStudentSubmission(id, user.uid);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
