import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminChapterEditView } from "@/features/lessons/components/admin-chapter-edit-view";

type AdminChapterPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Topic Details",
  description: "Edit a lesson topic.",
};

export default async function AdminChapterPage({ params }: AdminChapterPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Topic details"
        description="Edit topic metadata and visibility."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Topics", href: "/admin/chapters" },
          { label: "Details" },
        ]}
      />
      <AdminChapterEditView chapterId={id} />
    </>
  );
}
