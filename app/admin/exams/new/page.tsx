import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminExamFormView } from "@/features/exams/components/admin-exam-form-view";

export const metadata: Metadata = {
  title: "New exam",
  description: "Create a new PDF exam.",
};

export default function NewExamPage() {
  return (
    <>
      <AdminPageHeader
        title="New exam"
        description="Create a PDF exam and publish it when the global timer should begin."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Exams", href: "/admin/exams" },
          { label: "New" },
        ]}
      />
      <AdminExamFormView />
    </>
  );
}
