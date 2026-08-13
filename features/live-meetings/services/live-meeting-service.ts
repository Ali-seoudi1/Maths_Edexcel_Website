"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { LiveMeeting, LiveMeetingFormValues } from "../types";

async function getIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.getIdToken();
}

async function requestJson<TResponse>(url: string, init: RequestInit = {}): Promise<TResponse> {
  const token = await getIdToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "The live meeting request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

export async function getAdminLiveMeeting() {
  return requestJson<{ meeting: LiveMeeting | null }>("/api/admin/live-meeting");
}

export async function saveAdminLiveMeeting(values: LiveMeetingFormValues) {
  return requestJson<{ meeting: LiveMeeting }>("/api/admin/live-meeting", {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

export async function clearAdminLiveMeeting() {
  return requestJson<{ deletedLiveMeetingId: string }>("/api/admin/live-meeting", {
    method: "DELETE",
  });
}

export async function getStudentLiveMeeting() {
  return requestJson<{ meeting: LiveMeeting | null }>("/api/live-meeting");
}
