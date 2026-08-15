"use client";

import { getDownloadURL, ref } from "firebase/storage";

import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";

import type { ModelAnswerSearchValues } from "../schemas";
import type {
  ModelAnswer,
  ModelAnswerFilters,
  ModelAnswerPayload,
  OfficialResourceType,
} from "../types";

async function getIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.getIdToken();
}

async function requestJson<TResponse>(url: string, init: RequestInit): Promise<TResponse> {
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
        : "The key question request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

async function requestFormData<TResponse>(url: string, formData: FormData): Promise<TResponse> {
  const token = await getIdToken();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "The mark scheme file could not be uploaded.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function toSearchParams(filters: ModelAnswerFilters) {
  const params = new URLSearchParams();

  if (filters.examYear) {
    params.set("examYear", String(filters.examYear));
  }

  if (filters.session) {
    params.set("session", filters.session);
  }

  if (filters.paper) {
    params.set("paper", filters.paper);
  }

  if (filters.questionNumber) {
    params.set("questionNumber", filters.questionNumber);
  }

  if (typeof filters.published === "boolean") {
    params.set("published", String(filters.published));
  }

  return params;
}

export async function uploadOfficialMarkScheme(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestFormData<{
    path: string;
    fileName: string;
    type: OfficialResourceType;
  }>("/api/admin/model-answers/upload", formData);
}

export async function getStorageDownloadUrl(path: string) {
  return getDownloadURL(ref(getFirebaseStorage(), path));
}

export async function listModelAnswers(filters: ModelAnswerFilters = {}) {
  const params = toSearchParams(filters);
  const queryString = params.toString();
  return requestJson<{ modelAnswers: ModelAnswer[] }>(
    `/api/admin/model-answers${queryString ? `?${queryString}` : ""}`,
    { method: "GET" },
  );
}

export async function getModelAnswer(id: string) {
  return requestJson<{ modelAnswer: ModelAnswer }>(`/api/admin/model-answers/${id}`, {
    method: "GET",
  });
}

export async function createModelAnswer(values: ModelAnswerPayload) {
  return requestJson<{ modelAnswer: ModelAnswer }>("/api/admin/model-answers", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateModelAnswer(id: string, values: ModelAnswerPayload) {
  return requestJson<{ modelAnswer: ModelAnswer }>(`/api/admin/model-answers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function deleteModelAnswer(id: string) {
  return requestJson<{ deletedModelAnswerId: string }>(`/api/admin/model-answers/${id}`, {
    method: "DELETE",
  });
}

export async function searchModelAnswer(filters: ModelAnswerSearchValues) {
  const params = toSearchParams(filters);
  return requestJson<{ modelAnswer: ModelAnswer | null }>(
    `/api/model-answers/search?${params.toString()}`,
    { method: "GET" },
  );
}
