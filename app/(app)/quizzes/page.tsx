import type { Metadata } from "next";

import { PageTitle } from "@/components/dashboard";
import { ToastProvider } from "@/components/ui/toast";
import { StudentQuizListView } from "@/features/quizzes/components/student-quiz-list-view";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "View and complete timed quizzes.",
};

export default function StudentQuizzesPage() {
  return (
    <ToastProvider>
      <div className="space-y-8">
        <PageTitle eyebrow="Assessment" title="Quizzes" />
        <StudentQuizListView />
      </div>
    </ToastProvider>
  );
}
