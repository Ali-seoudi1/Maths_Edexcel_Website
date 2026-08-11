export type QuizStatus = "draft" | "active" | "closed";

export type QuizPdf = {
  id: string;
  path: string;
  fileName: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  pdfs: QuizPdf[];
  published: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  status: QuizStatus;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizFormValues = {
  title: string;
  description: string;
  durationMinutes: number;
  published?: boolean;
};

export type QuizSubmissionStatus = "submitted" | "late" | "graded";

export type QuizSubmission = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  pdfPath: string;
  pdfFileName: string;
  submittedAt: string | null;
  late: boolean;
  lateBySeconds: number;
  status: QuizSubmissionStatus;
  finalized: boolean;
  graded: boolean;
  gradedAt: string | null;
  gradedBy: string;
  score: number | null;
  feedback: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizGradeValues = {
  score?: number | null;
  feedback?: string;
};
