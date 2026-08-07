"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { PastPapersSettingsFormValues } from "../schemas";
import type { PastPapersSettings } from "../types";

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
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "The past papers request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

export async function getAdminPastPapersSettings() {
  return requestJson<{ settings: PastPapersSettings }>("/api/admin/past-papers");
}

export async function saveAdminPastPapersSettings(values: PastPapersSettingsFormValues) {
  return requestJson<{ settings: PastPapersSettings }>("/api/admin/past-papers", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function removeAdminPastPapersSettings() {
  return requestJson<{ settings: PastPapersSettings }>("/api/admin/past-papers", {
    method: "DELETE",
  });
}

export async function getPastPapersSettings() {
  return requestJson<{ settings: PastPapersSettings }>("/api/past-papers");
}
