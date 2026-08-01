import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswerFormView } from "@/features/model-answers/components/admin-model-answer-form-view";

export const metadata: Metadata = {
  title: "New Model Answer",
  description: "Create a model answer.",
};

export default function NewModelAnswerPage() {
  return (
    <>
      <AdminPageHeader
        title="New Model Answer"
        description="Upload the official mark scheme and write the teacher solution."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Model Answers", href: "/admin/model-answers" },
          { label: "New" },
        ]}
      />
      <AdminModelAnswerFormView />
    </>
  );
}
