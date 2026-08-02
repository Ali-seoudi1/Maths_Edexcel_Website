import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminChaptersView } from "@/features/lessons/components/admin-chapters-view";

export const metadata: Metadata = {
  title: "Chapters",
  description: "Manage lesson chapters.",
};

export default function AdminChaptersPage() {
  return (
    <>
      <AdminPageHeader
        title="Chapters"
        description="Create, publish, hide, reorder, and organize lesson chapters."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Chapters" }]}
        actions={
          <Button asChild>
            <Link href="/admin/chapters/new">New chapter</Link>
          </Button>
        }
      />
      <AdminChaptersView />
    </>
  );
}
