import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminExamEditView } from "@/features/exams/components/admin-exam-edit-view";

type AdminExamEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit exam",
  description: "Edit a draft exam before publishing.",
};

export default async function AdminExamEditPage({ params }: AdminExamEditPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit exam"
        description="Update a draft exam before publishing it."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "Edit" },
        ]}
      />
      <AdminExamEditView examId={id} />
    </>
  );
}
