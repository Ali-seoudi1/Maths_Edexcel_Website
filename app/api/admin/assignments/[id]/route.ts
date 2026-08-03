import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { deleteAssignment, getAssignmentById } from "@/features/assignments/services/server-assignment-service";
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
    const assignment = await getAssignmentById(id);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment was not found." }, { status: 404 });
    }

    return NextResponse.json({ assignment });
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
    await requireAdmin(request);
    const { id } = await context.params;
    const result = await deleteAssignment(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
