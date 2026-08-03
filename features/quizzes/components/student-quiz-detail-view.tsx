"use client";

import { Clock3, FileQuestion, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  getMyQuizSubmission,
  getQuiz,
  startQuiz,
  submitQuizAnswers,
} from "../services/quiz-service";
import type { Quiz, QuizSubmission } from "../types";

function formatTimeLeft(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function StudentQuizDetailView({ quizId }: { quizId: string }) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([getQuiz(quizId), getMyQuizSubmission(quizId)])
      .then(([quizResult, submissionResult]) => {
        setQuiz(quizResult.quiz);
        setSubmission(submissionResult.submission);

        if (submissionResult.submission?.answers) {
          setAnswers(submissionResult.submission.answers);
        }
      })
      .catch((error) => {
        toast({
          title: "Could not load quiz",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [quizId, toast]);

  useEffect(() => {
    if (!quiz || !submission || !submission.startedAt || submission.submittedAt) {
      return;
    }

    const started = new Date(submission.startedAt).getTime();
    const durationMs = quiz.durationMinutes * 60 * 1000;
    const now = Date.now();
    const remainingMs = Math.max(0, durationMs - (now - started));
    setStartedAt(remainingMs);

    const interval = window.setInterval(() => {
      setStartedAt((previous) => {
        if (previous === null) {
          return null;
        }

        const next = previous - 1000;
        if (next <= 0) {
          window.clearInterval(interval);
          void handleSubmit();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [quiz, submission]);

  const timeRemaining = useMemo(() => {
    if (startedAt === null) {
      return null;
    }

    return Math.ceil(startedAt / 1000);
  }, [startedAt]);

  async function handleStart() {
    if (!quiz) return;

    try {
      const result = await startQuiz(quiz.id);
      setSubmission(result.submission);
      setStartedAt(quiz.durationMinutes * 60 * 1000);
      toast({ title: "Quiz started", description: "The timer has begun.", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not start quiz",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSubmit() {
    if (!quiz || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const result = await submitQuizAnswers(quiz.id, answers ?? {});
      setSubmission(result.submission);
      toast({
        title: "Quiz submitted",
        description: "Your attempt was saved.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not submit quiz",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[60vh]" />;
  }

  if (!quiz) {
    return (
      <EmptyState
        title="Quiz not found"
        description="This quiz is not available."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  if (!submission) {
    return (
      <Card className="shadow-soft">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{quiz.title}</h1>
            <Badge variant="secondary">{quiz.durationMinutes} mins</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{quiz.description}</p>
          <Button type="button" onClick={() => void handleStart()}>
            Start quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (submission.submittedAt) {
    return (
      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-foreground">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">Submitted successfully.</p>
          <p className="text-lg font-semibold text-foreground">
            Score: {submission.score}/{submission.totalQuestions}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="shadow-soft">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Quiz timer</p>
            <p className="text-2xl font-semibold text-foreground">
              {timeRemaining === null ? "--:--" : formatTimeLeft(timeRemaining)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Time remaining</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">{quiz.title}</h2>
            <a
              href={`/api/quizzes/${quiz.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline"
            >
              Open PDF
            </a>
          </div>
          <iframe
            title={quiz.title}
            src={`/api/quizzes/${quiz.id}/pdf`}
            className="h-[70vh] w-full rounded-md border bg-white"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            "Submit quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
