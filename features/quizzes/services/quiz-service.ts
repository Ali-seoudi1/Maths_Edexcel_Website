"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { Quiz, QuizFormValues, QuizSubmission } from "../types";

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
        : "The request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

async function requestFormData<TResponse>(url: string, formData: FormData, method: "POST") {
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
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "The quiz request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function appendQuizFormData(values: QuizFormValues, pdfFile?: File) {
  const formData = new FormData();

  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("durationMinutes", String(values.durationMinutes));

  if (pdfFile) {
    formData.set("pdf", pdfFile);
  }

  return formData;
}

export async function listAdminQuizzes() {
  return requestJson<{ quizzes: Quiz[] }>("/api/admin/quizzes");
}

export async function getAdminQuiz(id: string) {
  return requestJson<{ quiz: Quiz }>(`/api/admin/quizzes/${id}`);
}

export async function createAdminQuiz(values: QuizFormValues, pdfFile: File) {
  return requestFormData<{ quiz: Quiz }>("/api/admin/quizzes", appendQuizFormData(values, pdfFile), "POST");
}

export async function deleteAdminQuiz(id: string) {
  return requestJson<{ deletedQuizId: string }>(`/api/admin/quizzes/${id}`, {
    method: "DELETE",
  });
}

export async function listQuizzes() {
  return requestJson<{ quizzes: Quiz[] }>("/api/quizzes");
}

export async function getQuiz(id: string) {
  return requestJson<{ quiz: Quiz }>(`/api/quizzes/${id}`);
}

export async function startQuiz(quizId: string) {
  return requestJson<{ submission: QuizSubmission }>(`/api/quizzes/${quizId}/start`, {
    method: "POST",
  });
}

export async function submitQuizAnswers(quizId: string, answers: Record<string, number>) {
  return requestJson<{ submission: QuizSubmission }>(`/api/quizzes/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers: answers ?? {} }),
  });
}

export async function getMyQuizSubmission(quizId: string) {
  return requestJson<{ submission: QuizSubmission | null }>(`/api/quizzes/${quizId}/submission`);
}
