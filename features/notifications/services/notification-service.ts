"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { StudentNotification } from "../types";

export const notificationsChangedEvent = "notifications-changed";

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
        : "The notification request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function dispatchNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(notificationsChangedEvent));
  }
}

export async function listNotifications(options: { unreadOnly?: boolean; limit?: number } = {}) {
  const params = new URLSearchParams();

  if (options.unreadOnly) params.set("filter", "unread");
  if (options.limit) params.set("limit", String(options.limit));

  const query = params.toString();
  return requestJson<{ notifications: StudentNotification[]; unreadCount: number }>(
    `/api/notifications${query ? `?${query}` : ""}`,
  );
}

export async function markNotificationRead(notificationId: string) {
  const result = await requestJson<{ notification: StudentNotification }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
  dispatchNotificationsChanged();

  return result;
}

export async function markDisplayedNotificationsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) {
    return;
  }

  await Promise.all(
    notificationIds.map((notificationId) =>
      requestJson<{ notification: StudentNotification }>(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),
    ),
  );
  dispatchNotificationsChanged();
}

export async function markAllNotificationsRead() {
  const result = await requestJson<{ readCount: number }>("/api/notifications/read-all", {
    method: "POST",
  });
  dispatchNotificationsChanged();

  return result;
}
