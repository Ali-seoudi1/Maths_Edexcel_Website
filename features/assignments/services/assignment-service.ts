"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type {
  Assignment,
  AssignmentFormValues,
  AssignmentGradeValues,
  AssignmentSubmission,
} from "../types";

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
        : "The assignment request could not be completed.";

    throw new Error(errorMessage);
  }

  return payload as TResponse;
}

function appendAssignmentFormData(values: AssignmentFormValues, pdfFiles: File[] = []) {
  const formData = new FormData();

  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("deadline", values.deadline);

  pdfFiles.forEach((pdfFile) => formData.append("pdfs", pdfFile));

  return formData;
}

export async function listAdminAssignments() {
  return requestJson<{ assignments: Assignment[] }>("/api/admin/assignments");
}

export async function getAdminAssignment(id: string) {
  return requestJson<{ assignment: Assignment }>(`/api/admin/assignments/${id}`);
}

export async function createAdminAssignment(values: AssignmentFormValues, pdfFiles: File[]) {
  return requestFormData<{ assignment: Assignment }>(
    "/api/admin/assignments",
    appendAssignmentFormData(values, pdfFiles),
    "POST",
  );
}

export async function updateAdminAssignment(
  id: string,
  values: AssignmentFormValues,
  pdfFiles: File[],
) {
  return requestFormData<{ assignment: Assignment }>(
    `/api/admin/assignments/${id}`,
    appendAssignmentFormData(values, pdfFiles),
    "PATCH",
  );
}

export async function deleteAdminAssignment(id: string) {
  return requestJson<{ deletedAssignmentId: string }>(`/api/admin/assignments/${id}`, {
    method: "DELETE",
  });
}

export async function listAssignmentSubmissions(assignmentId: string) {
  return requestJson<{ submissions: AssignmentSubmission[] }>(`/api/admin/assignments/${assignmentId}/submissions`);
}

export async function updateAssignmentSubmissionGrade(
  assignmentId: string,
  submissionId: string,
  values: AssignmentGradeValues,
) {
  return requestJson<{ submission: AssignmentSubmission }>(
    `/api/admin/assignments/${assignmentId}/submissions/${submissionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export async function listAssignments() {
  return requestJson<{ assignments: Assignment[]; submissions: AssignmentSubmission[] }>(
    "/api/assignments",
  );
}

export async function getAssignment(id: string) {
  return requestJson<{ assignment: Assignment }>(`/api/assignments/${id}`);
}

export async function getMyAssignmentSubmission(assignmentId: string) {
  return requestJson<{ submission: AssignmentSubmission | null }>(`/api/assignments/${assignmentId}/submission`);
}

export async function deleteMyAssignmentSubmissionPdf(assignmentId: string, pdfId: string) {
  const params = new URLSearchParams({ pdfId });
  return requestJson<{ submission: AssignmentSubmission | null }>(
    `/api/assignments/${assignmentId}/submission?${params.toString()}`,
    {
      method: "DELETE",
    },
  );
}

export async function submitAssignmentSolution(assignmentId: string, pdfFiles: File[]) {
  const formData = new FormData();
  pdfFiles.forEach((pdfFile) => formData.append("pdfs", pdfFile));

  return requestFormData<{ submission: AssignmentSubmission }>(
    `/api/assignments/${assignmentId}/submit`,
    formData,
    "POST",
  );
}
