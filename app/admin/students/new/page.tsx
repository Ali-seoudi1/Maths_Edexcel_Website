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
        description="Create a Firebase Authentication user and matching users/{uid} student profile."
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
