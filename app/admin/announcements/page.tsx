import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminAnnouncementsView } from "@/features/announcements/components/admin-announcements-view";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Post student announcements.",
};

export default function AdminAnnouncementsPage() {
  return (
    <>
      <AdminPageHeader
        title="Announcements"
        description="Post updates for students about quizzes, assignments, deadlines, and revision notices."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Announcements" }]}
      />
      <AdminAnnouncementsView />
    </>
  );
}
