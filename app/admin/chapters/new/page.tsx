import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminChapterFormView } from "@/features/lessons/components/admin-chapter-form-view";

export const metadata: Metadata = {
  title: "New Chapter",
  description: "Create a lesson chapter.",
};

export default function NewChapterPage() {
  return (
    <>
      <AdminPageHeader
        title="New chapter"
        description="Add a chapter that PDF lessons can reference."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Chapters", href: "/admin/chapters" },
          { label: "New" },
        ]}
      />
      <AdminChapterFormView />
    </>
  );
}
