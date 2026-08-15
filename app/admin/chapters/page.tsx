import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminChaptersView } from "@/features/lessons/components/admin-chapters-view";

export const metadata: Metadata = {
  title: "Topics",
  description: "Manage lesson topics.",
};

export default function AdminChaptersPage() {
  return (
    <>
      <AdminPageHeader
        title="Topics"
        description="Create, publish, hide, and organize lesson topics."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Topics" }]}
        actions={
          <Button asChild>
            <Link href="/admin/chapters/new">New topic</Link>
          </Button>
        }
      />
      <AdminChaptersView />
    </>
  );
}
