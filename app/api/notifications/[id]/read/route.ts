import { NextResponse } from "next/server";

import { markNotificationRead } from "@/features/notifications/services/server-notification-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const user = await requireActiveUser(request);
    const { id } = await context.params;
    const notification = await markNotificationRead(user.uid, id);

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("[notifications] failed to mark notification read", error);
    return errorResponse(error, "Notification request failed.");
  }
}
