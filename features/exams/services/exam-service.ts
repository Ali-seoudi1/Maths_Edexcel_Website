"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { Exam, ExamAttempt, ExamFormValues, ExamGradeValues, ExamSubmission } from "../types";

let studentExamListRequest:
  | Promise<{ exams: Exam[]; submissions: ExamSubmission[]; attempts: ExamAttempt[] }>
  | null = null;

async function getIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.getIdToken();
}

export async function getExamAuthToken() {
  return getIdToken();
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
        : "The exam request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function appendExamFormData(values: ExamFormValues, pdfFiles: File[] = [], removedPdfIds: string[] = []) {
  const formData = new FormData();

  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("durationMinutes", String(values.durationMinutes));
  formData.set("maxScore", String(values.maxScore));
  formData.set("published", String(values.published === true));

  pdfFiles.forEach((pdfFile) => formData.append("pdfs", pdfFile));
  removedPdfIds.forEach((pdfId) => formData.append("removedPdfIds", pdfId));

  return formData;
}

export async function getProtectedExamPdfSrc(examId: string, pdfId?: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ token });

  if (pdfId) {
    params.set("pdfId", pdfId);
  }

  return `/api/exams/${examId}/pdf?${params.toString()}`;
}

export async function openProtectedAdminExamPdf(examId: string, pdfId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/exams/${examId}/pdf?pdfId=${encodeURIComponent(pdfId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("The exam PDF could not be opened.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function openProtectedExamSubmissionPdf(examId: string, submissionId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/exams/${examId}/submissions/${submissionId}/pdf`, {
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

export async function listAdminExams() {
  return requestJson<{ exams: Exam[] }>("/api/admin/exams");
}

export async function getAdminExam(id: string) {
  return requestJson<{ exam: Exam; serverNow: string }>(`/api/admin/exams/${id}`);
}

export async function createAdminExam(values: ExamFormValues, pdfFiles: File[]) {
  return requestFormData<{ exam: Exam }>("/api/admin/exams", appendExamFormData(values, pdfFiles), "POST");
}

export async function updateAdminExam(
  id: string,
  values: ExamFormValues,
  pdfFiles: File[] = [],
  removedPdfIds: string[] = [],
) {
  return requestFormData<{ exam: Exam }>(
    `/api/admin/exams/${id}`,
    appendExamFormData(values, pdfFiles, removedPdfIds),
    "PATCH",
  );
}

export async function deleteAdminExam(id: string) {
  return requestJson<{ deletedExamId: string }>(`/api/admin/exams/${id}`, {
    method: "DELETE",
  });
}

export async function listExamSubmissions(examId: string) {
  return requestJson<{ submissions: ExamSubmission[] }>(`/api/admin/exams/${examId}/submissions`);
}

export async function updateExamSubmissionGrade(
  examId: string,
  submissionId: string,
  values: ExamGradeValues,
) {
  return requestJson<{ submission: ExamSubmission }>(
    `/api/admin/exams/${examId}/submissions/${submissionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export async function listExams() {
  if (!studentExamListRequest) {
    studentExamListRequest = requestJson<{
      exams: Exam[];
      submissions: ExamSubmission[];
      attempts: ExamAttempt[];
    }>("/api/exams").finally(() => {
      studentExamListRequest = null;
    });
  }

  return studentExamListRequest;
}

export async function getExam(id: string) {
  return requestJson<{ exam: Exam; serverNow: string }>(`/api/exams/${id}`);
}

export async function startExam(examId: string) {
  return requestJson<{ exam: Exam; attempt: ExamAttempt; serverNow: string }>(`/api/exams/${examId}/start`, {
    method: "POST",
  });
}

export async function submitExamPdf(examId: string, pdfFile: File) {
  const formData = new FormData();
  formData.set("pdf", pdfFile);

  return requestFormData<{ submission: ExamSubmission }>(
    `/api/exams/${examId}/submit`,
    formData,
    "POST",
  );
}

export async function markExamNoSubmission(examId: string) {
  return requestJson<{ submission: ExamSubmission }>(`/api/exams/${examId}/no-submission`, {
    method: "POST",
  });
}

export function markExamNoSubmissionWithToken(examId: string, token: string) {
  return fetch(`/api/exams/${examId}/no-submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
    keepalive: true,
  });
}

export async function getMyExamSubmission(examId: string) {
  return requestJson<{ attempt: ExamAttempt | null; submission: ExamSubmission | null }>(
    `/api/exams/${examId}/submission`,
  );
}
