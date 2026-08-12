"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type { MonthlyReport } from "../types";

async function getIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.getIdToken();
}

export async function getMonthlyReport(month?: string) {
  const token = await getIdToken();
  const params = new URLSearchParams();

  if (month) {
    params.set("month", month);
  }

  const response = await fetch(`/api/reports/monthly${params.size ? `?${params.toString()}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "The report could not be loaded.";

    throw new Error(message);
  }

  return payload as { report: MonthlyReport };
}

export async function getAdminStudentMonthlyReport(studentId: string, month?: string) {
  const token = await getIdToken();
  const params = new URLSearchParams();

  if (month) {
    params.set("month", month);
  }

  const response = await fetch(
    `/api/admin/students/${studentId}/report${params.size ? `?${params.toString()}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "The report could not be loaded.";

    throw new Error(message);
  }

  return payload as { report: MonthlyReport };
}
