export type ExamStatus = "draft" | "active" | "closed";

export type ExamPdf = {
  id: string;
  path: string;
  fileName: string;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  maxScore: number;
  pdfs: ExamPdf[];
  published: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  status: ExamStatus;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExamFormValues = {
  title: string;
  description: string;
  durationMinutes: number;
  maxScore: number;
  published?: boolean;
};

export type ExamAttempt = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  openedAt: string | null;
  updatedAt: string | null;
};

export type ExamSubmissionStatus = "submitted" | "late" | "graded";

export type ExamSubmission = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  noSubmission?: boolean;
  pdfPath: string;
  pdfFileName: string;
  submittedAt: string | null;
  late: boolean;
  lateBySeconds: number;
  status: ExamSubmissionStatus;
  finalized: boolean;
  graded: boolean;
  gradedAt: string | null;
  gradedBy: string;
  score: number | null;
  maxScore: number;
  feedback: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExamGradeValues = {
  score?: number | null;
  feedback?: string;
};
