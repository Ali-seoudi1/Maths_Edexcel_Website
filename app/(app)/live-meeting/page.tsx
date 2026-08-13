import type { Metadata } from "next";

import { PageHeader } from "@/components/shared";
import { ToastProvider } from "@/components/ui/toast";
import { StudentLiveMeetingView } from "@/features/live-meetings/components/student-live-meeting-view";

export const metadata: Metadata = {
  title: "Live Meeting",
  description: "Join the current live class meeting.",
};

export default function LiveMeetingPage() {
  return (
    <ToastProvider>
      <div className="space-y-7">
        <PageHeader
          eyebrow="Live Class"
          title="Live Meeting"
          description="Join the live class link when your teacher posts one."
        />
        <StudentLiveMeetingView />
      </div>
    </ToastProvider>
  );
}
