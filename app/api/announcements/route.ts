import { NextResponse } from "next/server";

import { listAnnouncements } from "@/features/announcements/services/server-announcement-service";
import {
  adminSdkUnavailableResponse,
  errorResponse,
  requireActiveUser,
} from "@/features/lessons/services/route-helpers";

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireActiveUser(request);
    const announcements = await listAnnouncements({ publishedOnly: true });

    return NextResponse.json({ announcements });
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}
