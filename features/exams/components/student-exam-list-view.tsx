"use client";

import { ChevronRight, Clock3, FileQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { listExams } from "../services/exam-service";
import type { Exam, ExamAttempt, ExamSubmission } from "../types";

type ExamFilter = "all" | "submitted" | "unsubmitted";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentExamListView() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [filter, setFilter] = useState<ExamFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listExams()
      .then((result) => {
        setExams(result.exams);
        setSubmissions(result.submissions);
        setAttempts(result.attempts);
      })
      .catch((error) => {
        toast({
          title: "Could not load exams",
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

  if (exams.length === 0) {
    return (
      <EmptyState
        title="No exams available"
        description="Your teacher has not published any exams yet."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your exams</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open available exams and review finished results.
          </p>
        </div>
        <div className="inline-flex w-full rounded-xl border bg-card p-1 shadow-sm sm:w-auto">
          {[
            { label: "All", value: "all" },
            { label: "Submitted", value: "submitted" },
            { label: "Unsubmitted", value: "unsubmitted" },
          ].map((item) => (
            <Button
              key={item.value}
              type="button"
              variant={filter === item.value ? "default" : "ghost"}
              size="sm"
              className="flex-1 rounded-lg sm:flex-none"
              onClick={() => setFilter(item.value as ExamFilter)}
              showPendingOnPress={false}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {exams
        .filter((exam) => {
          const submission = submissions.find((item) => item.examId === exam.id);
          const isSubmitted = Boolean(submission && !submission.noSubmission && submission.status !== "cheating");

          if (filter === "submitted") return isSubmitted;
          if (filter === "unsubmitted") return !isSubmitted;
          return true;
        })
        .map((exam) => {
        const submission = submissions.find((item) => item.examId === exam.id);
        const attempt = attempts.find((item) => item.examId === exam.id);
        const hasGrade = submission?.feedbackReturned === true;
        const isFinishedForStudent = Boolean(submission);
        const isCheating = submission?.status === "cheating";
        const isNoSubmission = !isCheating && (submission?.noSubmission === true || (exam.status === "closed" && !submission));
        const canSubmitLate = Boolean(isNoSubmission && attempt);
        const isClosedForStudent = exam.status === "closed" || isFinishedForStudent;

        return (
          <Card
            key={exam.id}
            className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex min-w-0 gap-4">
                <div className={isFinishedForStudent ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"}>
                  <FileQuestion className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{exam.title}</h2>
                    <Badge variant={isClosedForStudent ? "outline" : "secondary"}>
                      {isFinishedForStudent ? "Finished" : exam.status === "scheduled" ? "Scheduled" : exam.status === "closed" ? "Closed" : "Active"}
                    </Badge>
                    {isCheating ? (
                      <Badge variant="destructive">Cheating</Badge>
                    ) : !submission?.noSubmission && isNoSubmission ? (
                      <Badge variant="outline">No submission</Badge>
                    ) : null}
                  </div>
                  {exam.description ? (
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{exam.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {exam.durationMinutes} minutes
                    </span>
                    <span>{exam.status === "scheduled" ? "Starts" : "Due"} {formatDate(exam.status === "scheduled" ? exam.publishedAt : exam.expiresAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                {isCheating ? (
                  <div className="text-right text-destructive">
                    <p className="text-sm font-bold">0/{exam.maxScore}</p>
                    <p className="text-xs font-semibold">Cheating</p>
                  </div>
                ) : submission?.noSubmission ? (
                  <div className="text-right text-destructive">
                    <p className="text-sm font-bold">0/{exam.maxScore}</p>
                    <p className="text-xs font-semibold">No solution (cheating)</p>
                  </div>
                ) : hasGrade ? (
                  <ScoreDisplay score={submission.score ?? 0} maxScore={exam.maxScore} compact />
                ) : submission?.graded ? (
                  <p className="text-sm font-semibold text-muted-foreground">Awaiting feedback</p>
                ) : (
                  <p className="text-sm font-semibold text-muted-foreground">Not graded</p>
                )}
                {isFinishedForStudent ? (
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                    Closed
                  </Button>
                ) : (exam.status === "closed" || exam.status === "scheduled") && !canSubmitLate ? (
                  <Button type="button" variant="outline" className="w-full sm:w-auto" disabled>
                    {exam.status === "scheduled" ? "Scheduled" : "Closed"}
                  </Button>
                ) : (
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={`/exams/${exam.id}`}>
                      {canSubmitLate ? "Submit late" : "Start exam"}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {exams.filter((exam) => {
        const submission = submissions.find((item) => item.examId === exam.id);
        const isSubmitted = Boolean(submission && !submission.noSubmission && submission.status !== "cheating");

        if (filter === "submitted") return isSubmitted;
        if (filter === "unsubmitted") return !isSubmitted;
        return true;
      }).length === 0 ? (
        <EmptyState
          title={filter === "submitted" ? "No submitted exams" : "No unsubmitted exams"}
          description="Switch filters to view the rest of your exams."
          icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
        />
      ) : null}
    </section>
  );
}
