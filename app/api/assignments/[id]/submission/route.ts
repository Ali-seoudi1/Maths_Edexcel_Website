import { NextResponse } from "next/server";

import { getStudentSubmission } from "@/features/assignments/services/server-assignment-service";
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
