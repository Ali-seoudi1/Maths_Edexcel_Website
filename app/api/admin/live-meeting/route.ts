import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  clearCurrentLiveMeeting,
  getCurrentLiveMeeting,
  saveCurrentLiveMeeting,
} from "@/features/live-meetings/services/server-live-meeting-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

function parsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Meeting details are required.");
  }

  const data = payload as Record<string, unknown>;
  const url = typeof data.url === "string" ? data.url.trim() : "";

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Enter a valid meeting URL.");
    }
  } catch {
    throw new Error("Enter a valid meeting URL.");
  }

  return {
    url,
    active: data.active !== false,
  };
}

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);
    const meeting = await getCurrentLiveMeeting();

    return NextResponse.json({ meeting });
  } catch (error) {
    return errorResponse(error, "Live meeting request failed.");
  }
}

export async function PUT(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const admin = await requireAdmin(request);
    const values = parsePayload(await request.json());
    const meeting = await saveCurrentLiveMeeting(values, admin.uid);

    return NextResponse.json({ meeting });
  } catch (error) {
    return errorResponse(error, "Live meeting request failed.");
  }
}

export async function DELETE(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);
    const result = await clearCurrentLiveMeeting();

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Live meeting request failed.");
  }
}
