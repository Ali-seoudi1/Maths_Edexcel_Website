import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentMonthlyReportView } from "@/features/reports/components/student-monthly-report-view";

export const metadata: Metadata = {
  title: "Reports",
  description: "View monthly learning reports.",
};

export default function ReportsPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Monthly Progress"
          title="Reports"
          description="Review your monthly assignment and quiz activity, grades, late submissions, and on-time work."
        />
        <StudentMonthlyReportView />
      </div>
    </ToastProvider>
  );
}
