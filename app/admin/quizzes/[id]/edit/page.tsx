import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminQuizEditView } from "@/features/quizzes/components/admin-quiz-edit-view";

type AdminQuizEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit quiz",
  description: "Edit a draft quiz before publishing.",
};

export default async function AdminQuizEditPage({ params }: AdminQuizEditPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit quiz"
        description="Update a draft quiz before publishing it."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Quizzes", href: "/admin/quizzes" },
          { label: "Edit" },
        ]}
      />
      <AdminQuizEditView quizId={id} />
    </>
  );
}
