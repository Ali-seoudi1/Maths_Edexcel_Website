"use client";

import { FileQuestion } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getAdminExam } from "../services/exam-service";
import type { Exam } from "../types";
import { AdminExamFormView } from "./admin-exam-form-view";

export function AdminExamEditView({ examId }: { examId: string }) {
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminExam(examId)
      .then((result) => setExam(result.exam))
      .catch((error) => {
        toast({
          title: "Could not load exam",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [examId, toast]);

  if (loading) {
    return <Skeleton className="h-96 max-w-3xl" />;
  }

  if (!exam) {
    return (
      <EmptyState
        title="Exam not found"
        description="This exam is not available for editing."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  if (exam.status === "active" || exam.status === "closed") {
    return (
      <EmptyState
        title="Exam editing is locked"
        description="Active or closed exams cannot be edited."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return <AdminExamFormView exam={exam} />;
}
