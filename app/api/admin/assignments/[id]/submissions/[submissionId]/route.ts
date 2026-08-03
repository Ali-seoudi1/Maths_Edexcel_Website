import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { assignmentGradeSchema } from "@/features/assignments/schemas";
import { updateAssignmentSubmissionGrade } from "@/features/assignments/services/server-assignment-service";
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
    await requireAdmin(request);
    const { id, submissionId } = await context.params;
    const values = assignmentGradeSchema.parse(await request.json());
    const submission = await updateAssignmentSubmissionGrade(id, submissionId, values);

    return NextResponse.json({ submission });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
