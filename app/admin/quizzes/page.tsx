import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Manage timed quiz assessments.",
};

export default function AdminQuizzesPage() {
  return (
    <>
      <AdminPageHeader
        title="Quizzes"
        description="Create timed quizzes for students and review their results."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Quizzes" }]}
        actions={
          <Button asChild>
            <Link href="/admin/quizzes/new">New quiz</Link>
          </Button>
        }
      />
    </>
  );
}
