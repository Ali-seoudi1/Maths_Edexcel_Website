import type { ExamSession, OfficialResourceType } from "./types";

export function normalizePaper(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeQuestionNumber(value: string) {
  return value.trim().toLowerCase();
}

export function getModelAnswerId({
  examYear,
  session,
  paper,
  questionNumber,
}: {
  examYear: number;
  session: ExamSession;
  paper: string;
  questionNumber: string;
}) {
  return [examYear, session, normalizePaper(paper), normalizeQuestionNumber(questionNumber)]
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase();
}

export function getOfficialResourceType(file: File): OfficialResourceType {
  return file.type.startsWith("image/") ? "image" : "pdf";
}
