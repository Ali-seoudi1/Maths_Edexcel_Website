import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { StudentExamDetailView } from "@/features/exams/components/student-exam-detail-view";

type ExamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Exam",
  description: "Take a timed exam.",
};

export default async function ExamPage({ params }: ExamPageProps) {
  const { id } = await params;

  return (
    <ToastProvider>
      <StudentExamDetailView examId={id} />
    </ToastProvider>
  );
}
