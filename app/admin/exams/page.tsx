import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminExamListView } from "@/features/exams/components/admin-exam-list-view";

export const metadata: Metadata = {
  title: "Exams",
  description: "Manage timed exam assessments.",
};

export default function AdminExamsPage() {
  return (
    <>
      <AdminPageHeader
        title="Exams"
        description="Create PDF exams, publish timed deadlines and review submissions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Exams" }]}
        actions={
          <Button asChild>
            <Link href="/admin/exams/new">New exam</Link>
          </Button>
        }
      />
      <AdminExamListView />
    </>
  );
}
