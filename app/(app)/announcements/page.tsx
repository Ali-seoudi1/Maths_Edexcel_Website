import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentAnnouncementsView } from "@/features/announcements/components/student-announcements-view";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Read teacher announcements.",
};

export default function AnnouncementsPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Teacher Updates"
          title="Announcements"
          description="Read updates about assignments, quizzes, deadlines and revision guidance."
        />
        <StudentAnnouncementsView />
      </div>
    </ToastProvider>
  );
}
