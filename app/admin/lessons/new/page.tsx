import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminLessonFormView } from "@/features/lessons/components/admin-lesson-form-view";

export const metadata: Metadata = {
  title: "New Lesson",
  description: "Create a PDF lesson.",
};

export default function NewLessonPage() {
  return (
    <>
      <AdminPageHeader
        title="New lesson"
        description="Upload a PDF lesson note and connect it to a topic."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Lessons", href: "/admin/lessons" },
          { label: "New" },
        ]}
      />
      <AdminLessonFormView />
    </>
  );
}
