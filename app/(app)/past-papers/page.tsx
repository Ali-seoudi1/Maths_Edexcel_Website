import type { Metadata } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { StudentPastPapersView } from "@/features/past-papers/components/student-past-papers-view";

export const metadata: Metadata = {
  title: "Past Papers & MS",
  description: "Open the official Edexcel IGCSE Mathematics past papers archive.",
};

export default function PastPapersPage() {
  return (
    <ToastProvider>
      <StudentPastPapersView />
    </ToastProvider>
  );
}
