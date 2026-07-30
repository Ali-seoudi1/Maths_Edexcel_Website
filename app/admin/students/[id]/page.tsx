import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { StudentDetailView } from "@/features/admin/students/components/student-detail-view";

type StudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Student Details",
  description: "View and edit a student account.",
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Student details"
        description="View profile information, edit account details, and manage access."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Students", href: "/admin/students" },
          { label: "Details" },
        ]}
      />
      <StudentDetailView studentId={id} />
    </>
  );
}
