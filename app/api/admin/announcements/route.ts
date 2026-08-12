import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/students/services/admin-auth";
import {
  createAnnouncement,
  listAnnouncements,
} from "@/features/announcements/services/server-announcement-service";
import { adminSdkUnavailableResponse, errorResponse } from "@/features/lessons/services/route-helpers";

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

export async function GET(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    await requireAdmin(request);
    const announcements = await listAnnouncements();

    return NextResponse.json({ announcements });
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}

export async function POST(request: Request) {
  const unavailableResponse = adminSdkUnavailableResponse();

  if (unavailableResponse) return unavailableResponse;

  try {
    const admin = await requireAdmin(request);
    const values = parsePayload(await request.json());
    const announcement = await createAnnouncement(values, admin.uid);

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Announcement request failed.");
  }
}
