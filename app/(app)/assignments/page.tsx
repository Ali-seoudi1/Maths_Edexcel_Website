import type { Metadata } from "next";

import { PageTitle } from "@/components/dashboard";
import { ToastProvider } from "@/components/ui/toast";
import { StudentAssignmentsView } from "@/features/assignments/components/student-assignments-view";

export const metadata: Metadata = {
  title: "Assignments",
  description: "View current assignments and submit your solutions.",
};

export default function StudentAssignmentsPage() {
  return (
    <ToastProvider>
      <div className="space-y-8">
        <PageTitle eyebrow="Coursework" title="Assignments" />
        <StudentAssignmentsView />
      </div>
    </ToastProvider>
  );
}
