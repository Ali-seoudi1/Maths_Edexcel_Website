import { NextResponse } from "next/server";

import { getUnreadAnnouncementCount } from "@/features/announcements/services/server-announcement-service";
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
    const unreadCount = await getUnreadAnnouncementCount(user.uid);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}
