import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { PageTitle } from "@/components/dashboard";
import { StudentLessonsView } from "@/features/lessons/components/student-lessons-view";

export const metadata: Metadata = {
  title: "Lessons",
  description: "View published PDF lessons.",
};

export default function LessonsPage() {
  return (
    <ToastProvider>
      <div className="space-y-8">
        <PageTitle eyebrow="PDF Lessons" title="Lessons" />
        <StudentLessonsView />
      </div>
    </ToastProvider>
  );
}
