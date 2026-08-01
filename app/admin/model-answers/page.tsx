import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminModelAnswersView } from "@/features/model-answers/components/admin-model-answers-view";

export const metadata: Metadata = {
  title: "Model Answers",
  description: "Manage model answers and official mark schemes.",
};

export default function AdminModelAnswersPage() {
  return (
    <>
      <AdminPageHeader
        title="Model Answers"
        description="Create, search, filter, edit, publish, and delete exam question solutions."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Model Answers" }]}
        actions={
          <Button asChild>
            <Link href="/admin/model-answers/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Model Answer
            </Link>
          </Button>
        }
      />
      <AdminModelAnswersView />
    </>
  );
}
