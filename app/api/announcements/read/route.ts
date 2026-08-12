import { NextResponse } from "next/server";

import { markAnnouncementsRead } from "@/features/announcements/services/server-announcement-service";
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
    const result = await markAnnouncementsRead(user.uid);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}
