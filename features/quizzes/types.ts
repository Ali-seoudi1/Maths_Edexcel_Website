export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  pdfUrl: string;
  pdfFileName: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type QuizFormValues = {
  title: string;
  description: string;
  durationMinutes: number;
};

export type QuizQuestionFormValue = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type QuizSubmission = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  startedAt: string | null;
  submittedAt: string | null;
  score: number;
  totalQuestions: number;
  answers: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
};
