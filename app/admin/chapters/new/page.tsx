import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminChapterFormView } from "@/features/lessons/components/admin-chapter-form-view";

export const metadata: Metadata = {
  title: "New Topic",
  description: "Create a lesson topic.",
};

export default function NewChapterPage() {
  return (
    <>
      <AdminPageHeader
        title="New topic"
        description="Add a topic that PDF lessons can reference."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Topics", href: "/admin/chapters" },
          { label: "New" },
        ]}
      />
      <AdminChapterFormView />
    </>
  );
}
