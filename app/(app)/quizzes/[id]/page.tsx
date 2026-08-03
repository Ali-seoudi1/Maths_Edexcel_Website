import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { StudentQuizDetailView } from "@/features/quizzes/components/student-quiz-detail-view";

type QuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Quiz",
  description: "Take a timed quiz.",
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;

  return (
    <ToastProvider>
      <StudentQuizDetailView quizId={id} />
    </ToastProvider>
  );
}
