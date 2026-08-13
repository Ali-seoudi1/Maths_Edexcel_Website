import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { assignmentPayloadSchema } from "@/features/assignments/schemas";
import {
  deleteAssignment,
  getAssignmentById,
  updateAssignment,
} from "@/features/assignments/services/server-assignment-service";
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

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    const formData = await request.formData();
    const pdfFiles = formData.getAll("pdfs").filter((file): file is File => file instanceof File);
    const values = assignmentPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      deadline: String(formData.get("deadline") ?? ""),
      maxGrade: Number(formData.get("maxGrade") ?? 100),
    });
    const assignment = await updateAssignment(id, values, pdfFiles, admin.uid);

    return NextResponse.json({ assignment });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
