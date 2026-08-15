import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswerFormView } from "@/features/model-answers/components/admin-model-answer-form-view";

export const metadata: Metadata = {
  title: "New Key Question",
  description: "Create a key question.",
};

export default function NewModelAnswerPage() {
  return (
    <>
      <AdminPageHeader
        title="New Key Question"
        description="Upload the official mark scheme and write the teacher solution."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Key Questions", href: "/admin/model-answers" },
          { label: "New" },
        ]}
      />
      <AdminModelAnswerFormView />
    </>
  );
}
