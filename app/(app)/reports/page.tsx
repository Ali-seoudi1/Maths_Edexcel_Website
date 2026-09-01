import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentOfficialReports } from "@/features/reports/components/student-official-reports";

export const metadata: Metadata = {
  title: "Reports",
  description: "View monthly learning reports.",
};

export default function ReportsPage() {
  return (
    <ToastProvider>
      <div className="space-y-10">
        <PageHeader
          eyebrow="Monthly Progress"
          title="Reports"
          description="View official monthly reports published by your teacher."
        />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Official monthly reports</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fixed historical reports finalized and published by your teacher.
            </p>
          </div>
          <StudentOfficialReports />
        </section>
      </div>
    </ToastProvider>
  );
}
