import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { StudentsTable } from "@/features/admin/students/components/students-table";

export const metadata: Metadata = {
  title: "Students",
  description: "Manage student accounts.",
};

export default function StudentsPage() {
  return (
    <>
      <AdminPageHeader
        title="Students"
        description="Search, review, and manage student account access."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Students" }]}
      />
      <StudentsTable />
    </>
  );
}
