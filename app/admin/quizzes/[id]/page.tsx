import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminQuizDetailView } from "@/features/quizzes/components/admin-quiz-detail-view";

type AdminQuizPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Quiz details",
  description: "Manage a PDF quiz and review submissions.",
};

export default async function AdminQuizPage({ params }: AdminQuizPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Quiz details"
        description="Edit the quiz, publish the timer, and grade submitted PDFs."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Quizzes", href: "/admin/quizzes" },
          { label: "Details" },
        ]}
      />
      <AdminQuizDetailView quizId={id} />
    </>
  );
}
