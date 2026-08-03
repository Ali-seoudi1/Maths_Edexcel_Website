import { NextResponse } from "next/server";

import { getAssignmentById } from "@/features/assignments/services/server-assignment-service";
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
    await requireActiveUser(request);
    const { id } = await context.params;
    const assignment = await getAssignmentById(id);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
