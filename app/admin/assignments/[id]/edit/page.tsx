import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminAssignmentFormView } from "@/features/assignments/components/admin-assignment-form-view";

type EditAssignmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Assignment",
  description: "Edit assignment details, deadline and PDFs.",
};

export default async function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit assignment"
        description="Update the assignment text, deadline, or add more PDFs."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Assignments", href: "/admin/assignments" },
          { label: "Edit" },
        ]}
      />
      <AdminAssignmentFormView assignmentId={id} />
    </>
  );
}
