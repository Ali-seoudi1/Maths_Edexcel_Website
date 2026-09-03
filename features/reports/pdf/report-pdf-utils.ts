import { NextResponse } from "next/server";

import { getFirebaseAdminDb } from "@/lib/firebase/admin";

export type ReportPdfStudent = {
  uid: string;
  fullName: string;
  email: string;
  studentCode: string;
};

export async function getReportPdfStudent(studentId: string): Promise<ReportPdfStudent> {
  const snapshot = await getFirebaseAdminDb().collection("users").doc(studentId).get();
  const data = snapshot.data();

  if (!snapshot.exists || data?.role !== "student") {
    throw new Error("Student account was not found.");
  }

  return {
    uid: snapshot.id,
    fullName: typeof data.fullName === "string" && data.fullName.trim() ? data.fullName : "Student",
    email: typeof data.email === "string" ? data.email : "",
    studentCode: typeof data.studentCode === "string" && data.studentCode.trim() ? data.studentCode : snapshot.id,
  };
}

export function formatPdfPeriod(period: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) return period;

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)),
  );
}

export function formatPdfDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatPdfPercent(value: number | null) {
  return typeof value === "number" ? `${value.toFixed(value % 1 === 0 ? 0 : 1)}%` : "N/A";
}

export function formatPdfScore(score: number | null, maxScore: number | null) {
  if (typeof score !== "number" || typeof maxScore !== "number") {
    return "Not graded";
  }

  return `${score}/${maxScore}`;
}

export function formatItemType(type: string) {
  return type
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function sanitizePdfFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

export function pdfResponse(buffer: Buffer, fileName: string) {
  const safeFileName = sanitizePdfFileName(fileName) || "report.pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
