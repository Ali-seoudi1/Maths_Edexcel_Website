import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentQuizListView } from "@/features/quizzes/components/student-quiz-list-view";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "View and complete timed quizzes.",
};

export default function StudentQuizzesPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Assessment"
          title="Quizzes"
          description="Open active timed quizzes, submit your PDF solution and see your score after grading."
        />
        <StudentQuizListView />
      </div>
    </ToastProvider>
  );
}
