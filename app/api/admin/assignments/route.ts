import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { assignmentPayloadSchema } from "@/features/assignments/schemas";
import { createAssignment, listAssignments } from "@/features/assignments/services/server-assignment-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    await requireAdmin(request);
    const assignments = await listAssignments();
    return NextResponse.json({ assignments });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) {
    return unavailableResponse;
  }

  try {
    const admin = await requireAdmin(request);
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");

    if (!(pdfFile instanceof File)) {
      throw new Error("Upload an assignment PDF.");
    }

    const values = assignmentPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      deadline: String(formData.get("deadline") ?? ""),
    });

    const assignment = await createAssignment(values, pdfFile, admin.uid);
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
