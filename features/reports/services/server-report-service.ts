import { Timestamp } from "firebase-admin/firestore";

import {
  listAssignments,
  listStudentAssignmentSubmissions,
} from "@/features/assignments/services/server-assignment-service";
import {
  listQuizzes,
  listStudentQuizAttempts,
  listStudentQuizSubmissions,
} from "@/features/quizzes/services/server-quiz-service";

import type { MonthlyReport, MonthlyReportItem } from "../types";

function getMonthRange(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    throw new Error("Use a month in YYYY-MM format.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { start, end };
}

function isInMonth(value: string | null, start: Date, end: Date) {
  if (!value) return false;

  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function isPast(value: string | null) {
  return Boolean(value && Date.now() > new Date(value).getTime());
}

export function getCurrentReportMonth() {
  return Timestamp.now().toDate().toISOString().slice(0, 7);
}

export async function generateMonthlyReport(studentId: string, month: string): Promise<MonthlyReport> {
  const { start, end } = getMonthRange(month);
  const [assignments, quizSubmissions, quizAttempts, quizzes] = await Promise.all([
    listAssignments(),
    listStudentQuizSubmissions(studentId),
    listStudentQuizAttempts(studentId),
    listQuizzes(),
  ]);
  const assignmentRecords = await listStudentAssignmentSubmissions(studentId, assignments);
  const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

  const assignmentItems: MonthlyReportItem[] = assignmentRecords
    .filter(({ submission }) => isInMonth(submission.submittedAt, start, end))
    .map(({ assignment, submission }) => ({
      id: submission.id,
      type: "assignment",
      title: assignment?.title ?? "Assignment",
      submittedAt: submission.submittedAt,
      status: submission.isLate ? "late" : typeof submission.grade === "number" ? "graded" : "on-time",
      score: submission.grade,
      feedback: submission.feedback,
    }));
  const submittedAssignmentIds = new Set(assignmentRecords.map(({ submission }) => submission.assignmentId));
  const noSubmissionAssignmentItems: MonthlyReportItem[] = assignments
    .filter((assignment) => !submittedAssignmentIds.has(assignment.id))
    .filter((assignment) => isPast(assignment.deadline))
    .filter((assignment) => isInMonth(assignment.deadline, start, end))
    .map((assignment) => ({
      id: `assignment-no-submission-${assignment.id}`,
      type: "assignment",
      title: assignment.title,
      submittedAt: assignment.deadline,
      status: "no-submission",
      score: null,
      feedback: "",
    }));

  const quizItems: MonthlyReportItem[] = quizSubmissions
    .filter((submission) => isInMonth(submission.submittedAt, start, end))
    .map((submission) => ({
      id: submission.id,
      type: "quiz",
      title: quizMap.get(submission.quizId)?.title ?? "Quiz",
      submittedAt: submission.submittedAt,
      status: submission.late ? "late" : submission.graded ? "graded" : "on-time",
      score: submission.score,
      feedback: submission.feedback,
    }));

  const submittedQuizIds = new Set(quizSubmissions.map((submission) => submission.quizId));
  const noSubmissionQuizIds = new Set(
    quizzes
      .filter((quiz) => quiz.status === "closed")
      .filter((quiz) => !submittedQuizIds.has(quiz.id))
      .filter((quiz) => isInMonth(quiz.expiresAt, start, end))
      .map((quiz) => quiz.id),
  );
  const noSubmissionQuizItems: MonthlyReportItem[] = quizzes
    .filter((quiz) => noSubmissionQuizIds.has(quiz.id))
    .map((quiz) => ({
      id: `quiz-no-submission-${quiz.id}`,
      type: "quiz",
      title: quiz.title,
      submittedAt: quiz.expiresAt,
      status: "no-submission",
      score: null,
      feedback: "",
    }));
  const attemptItems: MonthlyReportItem[] = quizAttempts
    .filter((attempt) => !submittedQuizIds.has(attempt.quizId))
    .filter((attempt) => !noSubmissionQuizIds.has(attempt.quizId))
    .filter((attempt) => isInMonth(attempt.openedAt, start, end))
    .map((attempt) => ({
      id: attempt.id,
      type: "quiz-attempt",
      title: quizMap.get(attempt.quizId)?.title ?? "Quiz",
      submittedAt: attempt.openedAt,
      status: "opened",
      score: null,
      feedback: "",
    }));

  const items = [
    ...assignmentItems,
    ...noSubmissionAssignmentItems,
    ...quizItems,
    ...noSubmissionQuizItems,
    ...attemptItems,
  ].sort((a, b) => {
    const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return bTime - aTime;
  });

  return {
    month,
    generatedAt: Timestamp.now().toDate().toISOString(),
    totals: {
      assignmentsSubmitted: assignmentItems.length,
      quizzesSubmitted: quizItems.length,
      quizzesOpened: quizItems.length + attemptItems.length,
      lateSubmissions: items.filter((item) => item.status === "late").length,
      onTimeSubmissions: items.filter((item) => item.status === "on-time" || item.status === "graded").length,
      gradedItems: items.filter((item) => typeof item.score === "number").length,
      noSubmissions: items.filter((item) => item.status === "no-submission").length,
    },
    items,
  };
}
