"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { ChapterFormValues, LessonFormValues } from "../schemas";
import type { Chapter, Lesson } from "../types";

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
        : "The request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

async function requestFormData<TResponse>(url: string, formData: FormData, method: "POST" | "PATCH") {
  const token = await getIdToken();
  const response = await fetch(url, {
    method,
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
        : "The lesson request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function appendLessonFormData(values: LessonFormValues, pdfFiles: File[] = []) {
  const formData = new FormData();

  formData.set("chapterId", values.chapterId);
  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("order", String(values.order));
  formData.set("published", String(values.published));

  pdfFiles.forEach((pdfFile) => {
    formData.append("pdfs", pdfFile);
  });

  return formData;
}

export async function listAdminChapters() {
  return requestJson<{ chapters: Chapter[] }>("/api/admin/chapters");
}

export async function getAdminChapter(id: string) {
  return requestJson<{ chapter: Chapter }>(`/api/admin/chapters/${id}`);
}

export async function createAdminChapter(values: ChapterFormValues) {
  return requestJson<{ chapter: Chapter }>("/api/admin/chapters", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateAdminChapter(id: string, values: ChapterFormValues) {
  return requestJson<{ chapter: Chapter }>(`/api/admin/chapters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function deleteAdminChapter(id: string) {
  return requestJson<{ deletedChapterId: string }>(`/api/admin/chapters/${id}`, {
    method: "DELETE",
  });
}

export async function listAdminLessons(chapterId?: string) {
  const params = new URLSearchParams();

  if (chapterId) {
    params.set("chapterId", chapterId);
  }

  return requestJson<{ lessons: Lesson[] }>(
    `/api/admin/lessons${params.size ? `?${params.toString()}` : ""}`,
  );
}

export async function getAdminLesson(id: string) {
  return requestJson<{ lesson: Lesson }>(`/api/admin/lessons/${id}`);
}

export async function createAdminLesson(values: LessonFormValues, pdfFiles: File[]) {
  return requestFormData<{ lesson: Lesson }>(
    "/api/admin/lessons",
    appendLessonFormData(values, pdfFiles),
    "POST",
  );
}

export async function updateAdminLesson(id: string, values: LessonFormValues, pdfFiles: File[]) {
  return requestFormData<{ lesson: Lesson }>(
    `/api/admin/lessons/${id}`,
    appendLessonFormData(values, pdfFiles),
    "PATCH",
  );
}

export async function deleteAdminLesson(id: string) {
  return requestJson<{ deletedLessonId: string }>(`/api/admin/lessons/${id}`, {
    method: "DELETE",
  });
}

export async function listPublishedChapters() {
  return requestJson<{ chapters: Chapter[] }>("/api/chapters");
}

export async function listPublishedLessons(chapterId?: string) {
  const params = new URLSearchParams();

  if (chapterId) {
    params.set("chapterId", chapterId);
  }

  return requestJson<{ lessons: Lesson[] }>(
    `/api/lessons${params.size ? `?${params.toString()}` : ""}`,
  );
}

export async function getPublishedLesson(id: string) {
  return requestJson<{ lesson: Lesson }>(`/api/lessons/${id}`);
}
