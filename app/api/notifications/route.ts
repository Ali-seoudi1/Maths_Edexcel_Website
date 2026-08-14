import { NextResponse } from "next/server";

import {
  listStudentNotifications,
} from "@/features/notifications/services/server-notification-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 100);
    const unreadOnly = searchParams.get("filter") === "unread";
    const [notifications, unreadNotifications] = await Promise.all([
      listStudentNotifications(user.uid, { unreadOnly, limit: Number.isFinite(limit) ? limit : 100 }),
      listStudentNotifications(user.uid, { unreadOnly: true }),
    ]);

    return NextResponse.json({ notifications, unreadCount: unreadNotifications.length });
  } catch (error) {
    console.error("[notifications] failed to list notifications", error);
    return errorResponse(error, "Notification request failed.");
  }
}
