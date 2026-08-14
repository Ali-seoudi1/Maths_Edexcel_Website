import { NextResponse } from "next/server";

import { markAllNotificationsRead } from "@/features/notifications/services/server-notification-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const result = await markAllNotificationsRead(user.uid);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[notifications] failed to mark all notifications read", error);
    return errorResponse(error, "Notification request failed.");
  }
}
