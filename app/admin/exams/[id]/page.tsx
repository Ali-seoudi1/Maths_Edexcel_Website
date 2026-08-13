import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminExamDetailView } from "@/features/exams/components/admin-exam-detail-view";

type AdminExamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Exam details",
  description: "View exam submissions.",
};

export default async function AdminExamPage({ params }: AdminExamPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Exam details"
        description="View student submissions and grade submitted PDFs."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "Details" },
        ]}
      />
      <AdminExamDetailView examId={id} />
    </>
  );
}
