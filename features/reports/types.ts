export type MonthlyReportItem = {
  id: string;
  type: "assignment" | "quiz" | "quiz-attempt";
  title: string;
  submittedAt: string | null;
  status: "on-time" | "late" | "opened" | "graded" | "submitted" | "no-submission";
  score: number | null;
  feedback: string;
};

export type MonthlyReport = {
  month: string;
  generatedAt: string;
  totals: {
    assignmentsSubmitted: number;
    quizzesSubmitted: number;
    quizzesOpened: number;
    lateSubmissions: number;
    onTimeSubmissions: number;
    gradedItems: number;
    noSubmissions: number;
  };
  items: MonthlyReportItem[];
};
