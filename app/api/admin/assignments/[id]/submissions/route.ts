import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { listAssignmentSubmissions } from "@/features/assignments/services/server-assignment-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

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
    await requireAdmin(request);
    const { id } = await context.params;
    const submissions = await listAssignmentSubmissions(id);

    return NextResponse.json({ submissions });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
