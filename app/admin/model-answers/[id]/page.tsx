import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswerEditView } from "@/features/model-answers/components/admin-model-answer-edit-view";

type EditModelAnswerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Model Answer",
  description: "Edit a model answer.",
};

export default async function EditModelAnswerPage({ params }: EditModelAnswerPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit Model Answer"
        description="Update the exam details, mark scheme file, teacher solution, and publication status."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Model Answers", href: "/admin/model-answers" },
          { label: "Edit" },
        ]}
      />
      <AdminModelAnswerEditView modelAnswerId={id} />
    </>
  );
}
