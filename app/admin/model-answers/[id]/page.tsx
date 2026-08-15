import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswerEditView } from "@/features/model-answers/components/admin-model-answer-edit-view";

type EditModelAnswerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Key Question",
  description: "Edit a key question.",
};

export default async function EditModelAnswerPage({ params }: EditModelAnswerPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Edit Key Question"
        description="Update the exam details, mark scheme file, teacher solution, and publication status."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Key Questions", href: "/admin/model-answers" },
          { label: "Edit" },
        ]}
      />
      <AdminModelAnswerEditView modelAnswerId={id} />
    </>
  );
}
