import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminLessonsView } from "@/features/lessons/components/admin-lessons-view";

export const metadata: Metadata = {
  title: "Lessons",
  description: "Manage PDF lessons.",
};

export default function AdminLessonsPage() {
  return (
    <>
      <AdminPageHeader
        title="Lessons"
        description="Upload, publish, hide and manage PDF lesson notes."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Lessons" }]}
        actions={
          <Button asChild>
            <Link href="/admin/lessons/new">New lesson</Link>
          </Button>
        }
      />
      <AdminLessonsView />
    </>
  );
}
