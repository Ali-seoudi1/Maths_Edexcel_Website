import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminReportGenerator } from "@/features/reports/components/admin-report-generator";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review student performance and manage official reports.",
};

export default function AdminReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Review student performance and manage official reports."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
      />
      <AdminReportGenerator />
    </>
  );
}
