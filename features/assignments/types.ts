export type AssignmentPdf = {
  id: string;
  path: string;
  fileName: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  maxGrade: number;
  pdfs: AssignmentPdf[];
  pdfUrl: string;
  pdfFileName: string;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  noSubmission?: boolean;
  submittedAt: string | null;
  pdfs: AssignmentPdf[];
  pdfUrl: string;
  pdfFileName: string;
  grade: number | null;
  maxGrade: number;
  feedback: string;
  isLate: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AssignmentFormValues = {
  title: string;
  description: string;
  deadline: string;
  maxGrade: number;
};

export type AssignmentGradeValues = {
  grade?: number | null;
  feedback?: string;
};
