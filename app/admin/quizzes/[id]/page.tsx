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
  description: "View quiz submissions.",
};

export default async function AdminQuizPage({ params }: AdminQuizPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Quiz details"
        description="View student submissions and grade submitted PDFs."
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
