import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import { assignmentPayloadSchema } from "@/features/assignments/schemas";
import { createAssignment, listAssignments } from "@/features/assignments/services/server-assignment-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import { createNotificationForAllActiveStudents } from "@/features/notifications/services/server-notification-service";

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
    const pdfFiles = formData.getAll("pdfs").filter((file): file is File => file instanceof File);

    const values = assignmentPayloadSchema.parse({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      deadline: String(formData.get("deadline") ?? ""),
      maxGrade: Number(formData.get("maxGrade") ?? 100),
    });
    if (!values.description.trim() && pdfFiles.length === 0) {
      throw new Error("Add a description, upload at least one PDF, or both.");
    }

    const assignment = await createAssignment(values, pdfFiles, admin.uid);
    await createNotificationForAllActiveStudents({
      type: "assignment",
      title: `New assignment: ${assignment.title}`,
      message: "A new assignment is available for you.",
      link: "/assignments",
      relatedId: assignment.id,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Assignment request failed.");
  }
}
