import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin";
import { AdminAssignmentDetailView } from "@/features/assignments/components/admin-assignment-detail-view";

type AdminAssignmentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Assignment details",
  description: "Review student work and enter marks.",
};

export default async function AdminAssignmentPage({ params }: AdminAssignmentPageProps) {
  const { id } = await params;

  return (
    <>
      <AdminPageHeader
        title="Assignment details"
        description="Review each student submission, mark late work and record the grade and feedback."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Assignments", href: "/admin/assignments" },
          { label: "Details" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/assignments/${id}/edit`}>Edit assignment</Link>
          </Button>
        }
      />
      <AdminAssignmentDetailView assignmentId={id} />
    </>
  );
}
