import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { StudentMonthlyReportView } from "@/features/reports/components/student-monthly-report-view";

type StudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Student Report",
  description: "View a student's monthly performance report.",
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Student report"
        description="View the same monthly performance report shown in the student dashboard."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Students", href: "/admin/students" },
          { label: "Report" },
        ]}
      />
      <StudentMonthlyReportView studentId={id} />
    </>
  );
}
