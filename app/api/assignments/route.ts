import { NextResponse } from "next/server";

import { listAssignments } from "@/features/assignments/services/server-assignment-service";
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
    await requireActiveUser(request);
    const assignments = await listAssignments();

    return NextResponse.json({ assignments });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
