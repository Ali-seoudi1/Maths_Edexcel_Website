import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminQuizListView } from "@/features/quizzes/components/admin-quiz-list-view";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Manage timed quiz assessments.",
};

export default function AdminQuizzesPage() {
  return (
    <>
      <AdminPageHeader
        title="Quizzes"
        description="Create PDF quizzes, publish timed deadlines, and review submissions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Quizzes" }]}
        actions={
          <Button asChild>
            <Link href="/admin/quizzes/new">New quiz</Link>
          </Button>
        }
      />
      <AdminQuizListView />
    </>
  );
}
