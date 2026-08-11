import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminQuizFormView } from "@/features/quizzes/components/admin-quiz-form-view";

export const metadata: Metadata = {
  title: "New quiz",
  description: "Create a new PDF quiz.",
};

export default function NewQuizPage() {
  return (
    <>
      <AdminPageHeader
        title="New quiz"
        description="Create a PDF quiz and publish it when the global timer should begin."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Quizzes", href: "/admin/quizzes" },
          { label: "New" },
        ]}
      />
      <AdminQuizFormView />
    </>
  );
}
