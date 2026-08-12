"use client";

import { Clock3, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { listQuizzes } from "../services/quiz-service";
import type { Quiz, QuizAttempt, QuizSubmission } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentQuizListView() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listQuizzes()
      .then((result) => {
        setQuizzes(result.quizzes);
        setSubmissions(result.submissions);
        setAttempts(result.attempts);
      })
      .catch((error) => {
        toast({
          title: "Could not load quizzes",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes available"
        description="Your teacher has not published any quizzes yet."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const submission = submissions.find((item) => item.quizId === quiz.id);
        const attempt = attempts.find((item) => item.quizId === quiz.id);
        const hasGrade = submission?.graded === true;
        const isNoSubmission = quiz.status === "closed" && !submission;
        const canSubmitLate = Boolean(isNoSubmission && attempt);

        return (
          <Card key={quiz.id} className="transition-all hover:-translate-y-0.5 hover:shadow-card">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{quiz.title}</h2>
                  {hasGrade ? <ScoreDisplay score={submission.score ?? 0} compact /> : null}
                  <Badge variant={quiz.status === "closed" ? "outline" : "secondary"}>
                    {quiz.status === "closed" ? "Closed" : "Active"}
                  </Badge>
                  {isNoSubmission ? <Badge variant="outline">No submission</Badge> : null}
                </div>
                {quiz.description ? <p className="text-sm text-muted-foreground">{quiz.description}</p> : null}
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {quiz.durationMinutes} minutes · closes {formatDate(quiz.expiresAt)}
                </div>
              </div>
              {quiz.status === "closed" && !canSubmitLate ? (
                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                  Closed
                </Button>
              ) : (
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/quizzes/${quiz.id}`}>{canSubmitLate ? "Submit late" : "Open quiz"}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
