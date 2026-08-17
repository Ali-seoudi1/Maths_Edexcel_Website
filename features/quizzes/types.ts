export type QuizStatus = "draft" | "scheduled" | "active" | "closed";

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
  maxScore: number;
  pdfs: QuizPdf[];
  published: boolean;
  scheduledAt: string | null;
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
  maxScore: number;
  published?: boolean;
  scheduledAt?: string | null;
};

export type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  openedAt: string | null;
  updatedAt: string | null;
};

export type QuizSubmissionStatus = "submitted" | "late" | "graded" | "cheating";

export type QuizSubmission = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  noSubmission?: boolean;
  pdfPath: string;
  pdfFileName: string;
  submittedAt: string | null;
  late: boolean;
  lateBySeconds: number;
  cheatedAt: string | null;
  status: QuizSubmissionStatus;
  finalized: boolean;
  graded: boolean;
  gradedAt: string | null;
  gradedBy: string;
  score: number | null;
  maxScore: number;
  feedback: string;
  feedbackReturned: boolean;
  feedbackReturnedAt: string | null;
  correctedPdfPath: string;
  correctedPdfFileName: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizGradeValues = {
  score?: number | null;
  feedback?: string;
  returnFeedback?: boolean;
};
