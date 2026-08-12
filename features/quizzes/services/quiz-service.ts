"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { Quiz, QuizAttempt, QuizFormValues, QuizGradeValues, QuizSubmission } from "../types";

let studentQuizListRequest:
  | Promise<{ quizzes: Quiz[]; submissions: QuizSubmission[]; attempts: QuizAttempt[] }>
  | null = null;

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

async function requestFormData<TResponse>(
  url: string,
  formData: FormData,
  method: "POST" | "PATCH",
) {
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

function appendQuizFormData(values: QuizFormValues, pdfFiles: File[] = [], removedPdfIds: string[] = []) {
  const formData = new FormData();

  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("durationMinutes", String(values.durationMinutes));
  formData.set("published", String(values.published === true));

  pdfFiles.forEach((pdfFile) => formData.append("pdfs", pdfFile));
  removedPdfIds.forEach((pdfId) => formData.append("removedPdfIds", pdfId));

  return formData;
}

export async function getProtectedQuizPdfSrc(quizId: string, pdfId?: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ token });

  if (pdfId) {
    params.set("pdfId", pdfId);
  }

  return `/api/quizzes/${quizId}/pdf?${params.toString()}`;
}

export async function openProtectedAdminQuizPdf(quizId: string, pdfId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/quizzes/${quizId}/pdf?pdfId=${encodeURIComponent(pdfId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("The quiz PDF could not be opened.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function openProtectedQuizSubmissionPdf(quizId: string, submissionId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/quizzes/${quizId}/submissions/${submissionId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("The submission PDF could not be opened.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function listAdminQuizzes() {
  return requestJson<{ quizzes: Quiz[] }>("/api/admin/quizzes");
}

export async function getAdminQuiz(id: string) {
  return requestJson<{ quiz: Quiz; serverNow: string }>(`/api/admin/quizzes/${id}`);
}

export async function createAdminQuiz(values: QuizFormValues, pdfFiles: File[]) {
  return requestFormData<{ quiz: Quiz }>("/api/admin/quizzes", appendQuizFormData(values, pdfFiles), "POST");
}

export async function updateAdminQuiz(
  id: string,
  values: QuizFormValues,
  pdfFiles: File[] = [],
  removedPdfIds: string[] = [],
) {
  return requestFormData<{ quiz: Quiz }>(
    `/api/admin/quizzes/${id}`,
    appendQuizFormData(values, pdfFiles, removedPdfIds),
    "PATCH",
  );
}

export async function deleteAdminQuiz(id: string) {
  return requestJson<{ deletedQuizId: string }>(`/api/admin/quizzes/${id}`, {
    method: "DELETE",
  });
}

export async function listQuizSubmissions(quizId: string) {
  return requestJson<{ submissions: QuizSubmission[] }>(`/api/admin/quizzes/${quizId}/submissions`);
}

export async function updateQuizSubmissionGrade(
  quizId: string,
  submissionId: string,
  values: QuizGradeValues,
) {
  return requestJson<{ submission: QuizSubmission }>(
    `/api/admin/quizzes/${quizId}/submissions/${submissionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export async function listQuizzes() {
  if (!studentQuizListRequest) {
    studentQuizListRequest = requestJson<{
      quizzes: Quiz[];
      submissions: QuizSubmission[];
      attempts: QuizAttempt[];
    }>("/api/quizzes").finally(() => {
      studentQuizListRequest = null;
    });
  }

  return studentQuizListRequest;
}

export async function getQuiz(id: string) {
  return requestJson<{ quiz: Quiz; serverNow: string }>(`/api/quizzes/${id}`);
}

export async function startQuiz(quizId: string) {
  return requestJson<{ quiz: Quiz; attempt: QuizAttempt; serverNow: string }>(`/api/quizzes/${quizId}/start`, {
    method: "POST",
  });
}

export async function submitQuizPdf(quizId: string, pdfFile: File) {
  const formData = new FormData();
  formData.set("pdf", pdfFile);

  return requestFormData<{ submission: QuizSubmission }>(
    `/api/quizzes/${quizId}/submit`,
    formData,
    "POST",
  );
}

export async function getMyQuizSubmission(quizId: string) {
  return requestJson<{ attempt: QuizAttempt | null; submission: QuizSubmission | null }>(
    `/api/quizzes/${quizId}/submission`,
  );
}
