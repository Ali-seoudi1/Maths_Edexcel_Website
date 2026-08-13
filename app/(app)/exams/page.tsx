import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentExamListView } from "@/features/exams/components/student-exam-list-view";

export const metadata: Metadata = {
  title: "Exams",
  description: "View and complete timed exams.",
};

export default function StudentExamsPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Assessment"
          title="Exams"
          description="Open active timed exams, submit your PDF solution, and see your score after grading."
        />
        <StudentExamListView />
      </div>
    </ToastProvider>
  );
}
