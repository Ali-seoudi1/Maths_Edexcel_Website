"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { Announcement, AnnouncementFormValues } from "../types";

const unreadCountCacheMs = 15_000;
export const unreadAnnouncementCountChangedEvent = "unread-announcement-count-changed";
let unreadCountCache: { value: number; expiresAt: number } | null = null;
let unreadCountRequest: Promise<{ unreadCount: number }> | null = null;

function setUnreadCountCache(value: number) {
  unreadCountCache = { value, expiresAt: Date.now() + unreadCountCacheMs };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(unreadAnnouncementCountChangedEvent, { detail: { unreadCount: value } }),
    );
  }
}

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
        : "The announcement request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

export async function listAdminAnnouncements() {
  return requestJson<{ announcements: Announcement[] }>("/api/admin/announcements");
}

export async function createAdminAnnouncement(values: AnnouncementFormValues) {
  return requestJson<{ announcement: Announcement }>("/api/admin/announcements", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateAdminAnnouncement(id: string, values: AnnouncementFormValues) {
  return requestJson<{ announcement: Announcement }>(`/api/admin/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function deleteAdminAnnouncement(id: string) {
  return requestJson<{ deletedAnnouncementId: string }>(`/api/admin/announcements/${id}`, {
    method: "DELETE",
  });
}

export async function listAnnouncements() {
  return requestJson<{ announcements: Announcement[] }>("/api/announcements");
}

export async function getUnreadAnnouncementCount() {
  if (unreadCountCache && unreadCountCache.expiresAt > Date.now()) {
    return { unreadCount: unreadCountCache.value };
  }

  if (!unreadCountRequest) {
    unreadCountRequest = requestJson<{ unreadCount: number }>("/api/announcements/unread-count")
      .then((result) => {
        setUnreadCountCache(result.unreadCount);

        return result;
      })
      .finally(() => {
        unreadCountRequest = null;
      });
  }

  return unreadCountRequest;
}

export async function markAnnouncementsRead() {
  const result = await requestJson<{ readCount: number }>("/api/announcements/read", { method: "POST" });
  setUnreadCountCache(0);

  return result;
}
