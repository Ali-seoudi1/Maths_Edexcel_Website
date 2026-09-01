"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type {
  MonthlyReport,
  ReportAnalyticsResult,
  MonthlyReportSnapshot,
  MonthlyReportSnapshotSummary,
  MonthlyReportStatusResult,
} from "../types";

async function getIdToken() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.getIdToken();
}

function extractError(payload: unknown, fallback: string) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : fallback;
}

/** Admin: check whether an official monthly report exists for a student + month. */
export async function getAdminReportStatus(studentId: string, month: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ studentId, month });
  const response = await fetch(`/api/admin/reports?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The report status could not be loaded."));
  }

  return payload as MonthlyReportStatusResult & { periodLabel: string };
}

/** Admin: finalize and publish the official monthly report for a student + month. */
export async function publishAdminReport(studentId: string, month: string) {
  const token = await getIdToken();
  const response = await fetch("/api/admin/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentId, month }),
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The report could not be published."));
  }

  return payload as { snapshot: MonthlyReportSnapshot };
}

/** Admin: aggregate analytics from published monthly report snapshots. */
export async function getAdminReportAnalytics(fromMonth: string, toMonth: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ fromMonth, toMonth });
  const response = await fetch(`/api/admin/reports/analytics?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "Report analytics could not be loaded."));
  }

  return payload as { analytics: ReportAnalyticsResult };
}

/** Student: list the official monthly reports the teacher has published. */
export async function listPublishedReports() {
  const token = await getIdToken();
  const response = await fetch("/api/reports/published", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "Your reports could not be loaded."));
  }

  return payload as { reports: MonthlyReportSnapshotSummary[] };
}

/** Student: open one published official monthly report snapshot. */
export async function getPublishedReport(month: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ month });
  const response = await fetch(`/api/reports/published?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "This report could not be loaded."));
  }

  return payload as { snapshot: MonthlyReportSnapshot };
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
