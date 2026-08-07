import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminPastPapersView } from "@/features/past-papers/components/admin-past-papers-view";

export const metadata: Metadata = {
  title: "Past Papers",
  description: "Manage the Google Drive archive for past papers.",
};

export default function AdminPastPapersPage() {
  return (
    <>
      <AdminPageHeader
        title="Past Papers"
        description="Manage the Google Drive archive containing official Edexcel IGCSE Mathematics past papers and mark schemes."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Past Papers" }]}
      />
      <AdminPastPapersView />
    </>
  );
}
