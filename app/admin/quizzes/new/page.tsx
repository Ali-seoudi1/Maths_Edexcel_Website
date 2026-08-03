import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminQuizFormView } from "@/features/quizzes/components/admin-quiz-form-view";

export const metadata: Metadata = {
  title: "New quiz",
  description: "Create a new timed quiz.",
};

export default function NewQuizPage() {
  return (
    <>
      <AdminPageHeader
        title="New quiz"
        description="Create a timed quiz with questions and a countdown duration for students."
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
