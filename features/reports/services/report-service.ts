"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

import type {
  CombinedReportSnapshot,
  CombinedReportSummary,
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

async function extractDownloadError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as unknown;

  return extractError(payload, fallback);
}

function fileNameFromDisposition(disposition: string | null, fallback: string) {
  const match = /filename="([^"]+)"/.exec(disposition ?? "");

  return match?.[1] ?? fallback;
}

async function downloadAuthenticatedPdf(url: string, fallbackFileName: string, fallbackError: string) {
  const token = await getIdToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await extractDownloadError(response, fallbackError));
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileNameFromDisposition(response.headers.get("content-disposition"), fallbackFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
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

/** Admin: generate or load a persistent draft monthly report for a student + month. */
export async function generateAdminReportDraft(studentId: string, month: string) {
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
    throw new Error(extractError(payload, "The report draft could not be generated."));
  }

  return payload as { snapshot: MonthlyReportSnapshot; alreadyExists: boolean };
}

/** Admin: publish the existing official monthly report draft for a student + month. */
export async function publishAdminReport(studentId: string, month: string) {
  const token = await getIdToken();
  const response = await fetch("/api/admin/reports", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentId, month, action: "publish" }),
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The report could not be published."));
  }

  return payload as { snapshot: MonthlyReportSnapshot; alreadyPublished: boolean };
}

/** Admin: delete an unpublished monthly report draft. */
export async function deleteAdminReportDraft(studentId: string, month: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ studentId, month });
  const response = await fetch(`/api/admin/reports?${params.toString()}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The report draft could not be deleted."));
  }

  return payload as { deleted: boolean };
}

/** Admin: download a published official monthly report PDF. */
export async function downloadAdminMonthlyReportPdf(studentId: string, month: string) {
  const params = new URLSearchParams({ studentId, month });

  await downloadAuthenticatedPdf(
    `/api/admin/reports/pdf?${params.toString()}`,
    `${studentId}-${month}-monthly-report.pdf`,
    "The monthly report PDF could not be downloaded.",
  );
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

/** Admin: generate a draft combined official report from published monthly snapshots. */
export async function generateAdminCombinedReport(studentId: string, fromMonth: string, toMonth: string) {
  const token = await getIdToken();
  const response = await fetch("/api/admin/reports/combined", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentId, fromMonth, toMonth }),
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The combined report could not be generated."));
  }

  return payload as { snapshot: CombinedReportSnapshot; alreadyExists: boolean };
}

/** Admin: check whether a combined report draft/published snapshot exists. */
export async function getAdminCombinedReportStatus(studentId: string, fromMonth: string, toMonth: string) {
  const token = await getIdToken();
  const params = new URLSearchParams({ studentId, fromMonth, toMonth });
  const response = await fetch(`/api/admin/reports/combined?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The combined report status could not be loaded."));
  }

  return payload as
    | { status: "not_generated"; fromMonth: string; toMonth: string }
    | { status: "draft" | "published"; snapshot: CombinedReportSnapshot };
}

/** Admin: publish a generated combined official report to the selected student. */
export async function publishAdminCombinedReport(reportId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/reports/combined/${reportId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: "publish" }),
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The combined report could not be published."));
  }

  return payload as { snapshot: CombinedReportSnapshot; alreadyPublished: boolean };
}

/** Admin: delete an unpublished combined report draft. */
export async function deleteAdminCombinedReportDraft(reportId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/admin/reports/combined/${reportId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "The combined report draft could not be deleted."));
  }

  return payload as { deleted: boolean };
}

/** Admin: download a published combined official report PDF. */
export async function downloadAdminCombinedReportPdf(reportId: string) {
  await downloadAuthenticatedPdf(
    `/api/admin/reports/combined/${reportId}/pdf`,
    `${reportId}-combined-report.pdf`,
    "The combined report PDF could not be downloaded.",
  );
}

/** Student: list combined reports explicitly published to the current student. */
export async function listPublishedCombinedReports() {
  const token = await getIdToken();
  const response = await fetch("/api/reports/combined", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "Your combined reports could not be loaded."));
  }

  return payload as { reports: CombinedReportSummary[] };
}

/** Student: view one combined report explicitly published to the current student. */
export async function getPublishedCombinedReport(reportId: string) {
  const token = await getIdToken();
  const response = await fetch(`/api/reports/combined/${reportId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractError(payload, "This combined report could not be loaded."));
  }

  return payload as { snapshot: CombinedReportSnapshot };
}

/** Student: download one of their published combined report PDFs. */
export async function downloadPublishedCombinedReportPdf(reportId: string) {
  await downloadAuthenticatedPdf(
    `/api/reports/combined/${reportId}/pdf`,
    `${reportId}-combined-report.pdf`,
    "This combined report PDF could not be downloaded.",
  );
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

/** Student: download one of their published official monthly report PDFs. */
export async function downloadPublishedMonthlyReportPdf(month: string) {
  const params = new URLSearchParams({ month });

  await downloadAuthenticatedPdf(
    `/api/reports/published/pdf?${params.toString()}`,
    `${month}-monthly-report.pdf`,
    "This monthly report PDF could not be downloaded.",
  );
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
