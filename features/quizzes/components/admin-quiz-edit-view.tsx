"use client";

import { FileQuestion } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getAdminQuiz } from "../services/quiz-service";
import type { Quiz } from "../types";
import { AdminQuizFormView } from "./admin-quiz-form-view";

export function AdminQuizEditView({ quizId }: { quizId: string }) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminQuiz(quizId)
      .then((result) => setQuiz(result.quiz))
      .catch((error) => {
        toast({
          title: "Could not load quiz",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [quizId, toast]);

  if (loading) {
    return <Skeleton className="h-96 max-w-3xl" />;
  }

  if (!quiz) {
    return (
      <EmptyState
        title="Quiz not found"
        description="This quiz is not available for editing."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  if (quiz.status === "active" || quiz.status === "closed") {
    return (
      <EmptyState
        title="Quiz editing is locked"
        description="Active or closed quizzes cannot be edited."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return <AdminQuizFormView quiz={quiz} />;
}
