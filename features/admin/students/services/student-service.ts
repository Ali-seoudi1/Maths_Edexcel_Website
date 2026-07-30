import { sendPasswordResetEmail } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { CreateStudentResponse, Student } from "../types";
import type { EditStudentFormValues, StudentFormValues } from "../schemas";

async function getAdminIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in as an admin.");
  }

  return user.getIdToken();
}

async function requestJson<TResponse>(url: string, init: RequestInit): Promise<TResponse> {
  const token = await getAdminIdToken();
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
        : "The student request could not be completed.";

    throw new Error(
      errorMessage,
    );
  }

  return payload as TResponse;
}

export async function createStudent(values: StudentFormValues): Promise<CreateStudentResponse> {
  return requestJson<CreateStudentResponse>("/api/admin/students", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateStudent(
  uid: string,
  values: EditStudentFormValues,
): Promise<{ student: Student }> {
  return requestJson<{ student: Student }>(`/api/admin/students/${uid}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function softDeleteStudent(uid: string): Promise<{ student: Student }> {
  return requestJson<{ student: Student }>(`/api/admin/students/${uid}`, {
    method: "DELETE",
  });
}

export async function sendStudentPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}
