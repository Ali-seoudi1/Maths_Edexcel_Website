export type Assignment = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
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
  submittedAt: string | null;
  pdfUrl: string;
  pdfFileName: string;
  grade: number | null;
  feedback: string;
  isLate: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AssignmentFormValues = {
  title: string;
  description: string;
  deadline: string;
};

export type AssignmentGradeValues = {
  grade?: number | null;
  feedback?: string;
};
