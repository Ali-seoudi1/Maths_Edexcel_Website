import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminChapterEditView } from "@/features/lessons/components/admin-chapter-edit-view";

type AdminChapterPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Chapter Details",
  description: "Edit a lesson chapter.",
};

export default async function AdminChapterPage({ params }: AdminChapterPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Chapter details"
        description="Edit chapter metadata, visibility, and display order."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Chapters", href: "/admin/chapters" },
          { label: "Details" },
        ]}
      />
      <AdminChapterEditView chapterId={id} />
    </>
  );
}
