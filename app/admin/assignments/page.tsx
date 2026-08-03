import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminAssignmentsView } from "@/features/assignments/components/admin-assignments-view";

export const metadata: Metadata = {
  title: "Assignments",
  description: "Upload assignment PDFs and manage student submissions.",
};

export default function AdminAssignmentsPage() {
  return (
    <>
      <AdminPageHeader
        title="Assignments"
        description="Upload PDF assignments with a deadline for students, then review and grade student solutions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Assignments" }]}
        actions={
          <Button asChild>
            <Link href="/admin/assignments/new">New assignment</Link>
          </Button>
        }
      />
      <AdminAssignmentsView />
    </>
  );
}
