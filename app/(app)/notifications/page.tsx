import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { StudentNotificationsView } from "@/features/notifications/components/student-notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Review your student notifications.",
};

export default function NotificationsPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Student Dashboard"
        title="Notifications"
        description="Review updates from your teacher and your recent activity."
      />
      <StudentNotificationsView />
    </div>
  );
}
