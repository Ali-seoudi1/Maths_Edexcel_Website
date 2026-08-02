import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { StudentLessonDetailView } from "@/features/lessons/components/student-lesson-detail-view";

type LessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Lesson",
  description: "View a published PDF lesson.",
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;

  return (
    <ToastProvider>
      <StudentLessonDetailView lessonId={id} />
    </ToastProvider>
  );
}
