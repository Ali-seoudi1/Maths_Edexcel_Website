import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { CreateStudentView } from "@/features/admin/students/components/create-student-view";

export const metadata: Metadata = {
  title: "New Student",
  description: "Create a student account.",
};

export default function NewStudentPage() {
  return (
    <>
      <AdminPageHeader
        title="New student"
        description="Add a student and send them an email invitation to set their password."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Students", href: "/admin/students" },
          { label: "New" },
        ]}
      />
      <CreateStudentView />
    </>
  );
}
