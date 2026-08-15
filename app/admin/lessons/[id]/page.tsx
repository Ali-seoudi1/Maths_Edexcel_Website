import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminLessonFormView } from "@/features/lessons/components/admin-lesson-form-view";

type AdminLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Lesson Details",
  description: "Edit a PDF lesson.",
};

export default async function AdminLessonPage({ params }: AdminLessonPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Lesson details"
        description="Edit lesson metadata, visibility, or replace the PDF."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Lessons", href: "/admin/lessons" },
          { label: "Details" },
        ]}
      />
      <AdminLessonFormView lessonId={id} />
    </>
  );
}
