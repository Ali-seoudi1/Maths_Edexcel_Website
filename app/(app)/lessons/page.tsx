import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { PageHeader } from "@/components/shared";
import { StudentLessonsView } from "@/features/lessons/components/student-lessons-view";

export const metadata: Metadata = {
  title: "Lessons",
  description: "View published PDF lessons.",
};

export default function LessonsPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="PDF Lessons"
          title="Lessons"
          description="Choose a topic, then open the lesson PDFs and solved examples inside the platform."
        />
        <StudentLessonsView />
      </div>
    </ToastProvider>
  );
}
