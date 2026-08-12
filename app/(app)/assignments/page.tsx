import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentAssignmentsView } from "@/features/assignments/components/student-assignments-view";

export const metadata: Metadata = {
  title: "Assignments",
  description: "View current assignments and submit your solutions.",
};

export default function StudentAssignmentsPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Coursework"
          title="Assignments"
          description="Review the task, upload your PDF solution, and check feedback after grading."
        />
        <StudentAssignmentsView />
      </div>
    </ToastProvider>
  );
}
