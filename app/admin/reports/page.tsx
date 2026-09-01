import type { Metadata } from "next";

import { AdminPageHeader } from "@/features/admin";
import { AdminReportGenerator } from "@/features/reports/components/admin-report-generator";

export const metadata: Metadata = {
  title: "Reports",
  description: "Generate and publish official monthly student reports.",
};

export default function AdminReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Choose a student and month, then finalize and publish the official monthly report. Reports are never generated automatically — you decide when a month becomes official."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
      />
      <AdminReportGenerator />
    </>
  );
}
