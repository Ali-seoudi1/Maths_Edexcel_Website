import { NextResponse } from "next/server";

import {
  listAssignments,
  listStudentAssignmentSubmissions,
} from "@/features/assignments/services/server-assignment-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const user = await requireActiveUser(request);
    const assignments = await listAssignments();
    const submissionRecords = await listStudentAssignmentSubmissions(user.uid, assignments);
    const submissions = submissionRecords.map(({ submission }) => submission);

    return NextResponse.json({ assignments, submissions });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
