import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  deleteAnnouncement,
  updateAnnouncement,
} from "@/features/announcements/services/server-announcement-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";
import { createNotificationForAllActiveStudents } from "@/features/notifications/services/server-notification-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Announcement details are required.");
  }

  const data = payload as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (title.length < 2) {
    throw new Error("Enter an announcement title.");
  }

  if (message.length < 2) {
    throw new Error("Enter an announcement message.");
  }

  return {
    title,
    message,
    published: data.published !== false,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const announcement = await updateAnnouncement(id, parsePayload(await request.json()));

    if (announcement.published) {
      await createNotificationForAllActiveStudents({
        type: "announcement",
        title: "New announcement",
        message: announcement.title
          ? `${announcement.title} has been posted by your teacher.`
          : "A new announcement has been posted by your teacher.",
        link: "/announcements",
        relatedId: announcement.id,
      });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const result = await deleteAnnouncement(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}
