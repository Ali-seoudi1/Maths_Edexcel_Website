import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminLiveMeetingView } from "@/features/live-meetings/components/admin-live-meeting-view";

export const metadata: Metadata = {
  title: "Live Meeting",
  description: "Post a live meeting link for students.",
};

export default function AdminLiveMeetingPage() {
  return (
    <>
      <AdminPageHeader
        title="Live Meeting"
        description="Post the current live class link so students can join from their dashboard."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Live Meeting" }]}
      />
      <AdminLiveMeetingView />
    </>
  );
}
