import { NextResponse } from "next/server";

import { getCurrentLiveMeeting } from "@/features/live-meetings/services/server-live-meeting-service";
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
    const meeting = await getCurrentLiveMeeting({ activeOnly: true });

    return NextResponse.json({ meeting });
  } catch (error) {
    return errorResponse(error, "Live meeting request failed.");
  }
}
