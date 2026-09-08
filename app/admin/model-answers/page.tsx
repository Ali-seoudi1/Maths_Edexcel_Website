import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswersView } from "@/features/model-answers/components/admin-model-answers-view";

export const metadata: Metadata = {
  title: "Key Questions",
  description: "Manage key questions and official mark schemes.",
};

export default function AdminModelAnswersPage() {
  return (
    <>
      <AdminPageHeader
        title="Key Questions"
        description="Create, search, filter, edit, publish and delete exam question solutions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Key Questions" }]}
        actions={
          <Button asChild>
            <Link href="/admin/model-answers/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Key Question
            </Link>
          </Button>
        }
      />
      <AdminModelAnswersView />
    </>
  );
}
