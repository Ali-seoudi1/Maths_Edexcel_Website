import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminAssignmentFormView } from "@/features/assignments/components/admin-assignment-form-view";

export const metadata: Metadata = {
  title: "New Assignment",
  description: "Create a PDF assignment with a deadline.",
};

export default function NewAssignmentPage() {
  return (
    <>
      <AdminPageHeader
        title="New assignment"
        description="Upload a PDF assignment and set the submission deadline for students."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Assignments", href: "/admin/assignments" },
          { label: "New" },
        ]}
      />
      <AdminAssignmentFormView />
    </>
  );
}
