"use client";

import { Clock3, FileQuestion, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ScoreDisplay } from "@/components/shared/score-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import {
  getMyQuizSubmission,
  getProtectedQuizPdfSrc,
  getQuiz,
  startQuiz,
  submitQuizPdf,
} from "../services/quiz-service";
import type { Quiz, QuizAttempt, QuizSubmission } from "../types";
import { QuizPdfViewer } from "./quiz-pdf-viewer";

function formatTimeLeft(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLateBy(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec late`;
  if (remainingSeconds === 0) return `${minutes} min late`;
  return `${minutes} min ${remainingSeconds} sec late`;
}

export function StudentQuizDetailView({ quizId }: { quizId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [selectedPdfId, setSelectedPdfId] = useState("");
  const [pdfSrc, setPdfSrc] = useState("");
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    let mounted = true;

    void Promise.all([getQuiz(quizId), getMyQuizSubmission(quizId)])
      .then(async ([quizResult, submissionResult]) => {
        if (!mounted) return;

        const canRestoreQuizAccess = Boolean(submissionResult.attempt);
        const firstPdfId = canRestoreQuizAccess ? quizResult.quiz.pdfs[0]?.id ?? "" : "";
        const protectedPdfSrc = firstPdfId ? await getProtectedQuizPdfSrc(quizId, firstPdfId) : "";

        setQuiz(quizResult.quiz);
        setAttempt(submissionResult.attempt);
        setSubmission(submissionResult.submission);
        setSelectedPdfId(firstPdfId);
        setPdfSrc(protectedPdfSrc);
        setServerOffset(new Date(quizResult.serverNow).getTime() - Date.now());
      })
      .catch((error) => {
        console.error("[quiz] failed to load quiz view", error);
        toast({
          title: "Could not load quiz",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [quizId, toast]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!quiz?.expiresAt) return null;

    const serverNow = now + serverOffset;
    return Math.max(0, Math.ceil((new Date(quiz.expiresAt).getTime() - serverNow) / 1000));
  }, [now, quiz?.expiresAt, serverOffset]);

  const isClosed = remainingSeconds === 0 || quiz?.status === "closed";
  const hasOpenedQuiz = Boolean(attempt);
  const canOpenQuiz = Boolean(quiz) && !isClosed && !hasOpenedQuiz;
  const canViewQuiz = hasOpenedQuiz;
  const canSubmitQuiz = canViewQuiz && !submission;

  async function handleStart() {
    if (!quiz) return;

    if (!canOpenQuiz) {
      toast({
        title: "Quiz is closed",
        description: "This quiz can no longer be opened.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await startQuiz(quiz.id);
      const firstPdfId = result.quiz.pdfs[0]?.id ?? "";
      const protectedPdfSrc = firstPdfId ? await getProtectedQuizPdfSrc(quiz.id, firstPdfId) : "";

      setQuiz(result.quiz);
      setAttempt(result.attempt);
      setSelectedPdfId(firstPdfId);
      setPdfSrc(protectedPdfSrc);
      setServerOffset(new Date(result.serverNow).getTime() - Date.now());
      toast({ title: "Quiz opened", description: "Use the global deadline shown on this page.", variant: "success" });
    } catch (error) {
      toast({
        title: "Could not open quiz",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSelectPdf(pdfId: string) {
    if (!canViewQuiz) return;

    setSelectedPdfId(pdfId);
    setPdfSrc(await getProtectedQuizPdfSrc(quizId, pdfId));
  }

  async function handleSubmit() {
    if (!quiz || !answerFile || isSubmitting) return;

    if (!canSubmitQuiz) {
      toast({
        title: "Quiz submission unavailable",
        description: "Open the quiz before submitting your answer.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitQuizPdf(quiz.id, answerFile);
      setSubmission(result.submission);
      setAnswerFile(null);
      toast({
        title: "Submission successful",
        description: result.submission.late ? `Marked late by ${formatLateBy(result.submission.lateBySeconds)}.` : "Submitted on time.",
        variant: "success",
      });
      router.push("/quizzes");
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
    return (
      <div className="space-y-5">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-[60vh] rounded-2xl" />
      </div>
    );
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

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-normal text-foreground">{quiz.title}</h1>
                <Badge variant={isClosed ? "outline" : "secondary"}>{isClosed ? "Closed" : "Active"}</Badge>
              </div>
              {quiz.description ? (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{quiz.description}</p>
              ) : null}
            </div>
            {hasOpenedQuiz ? (
              <Badge variant="secondary">Opened</Badge>
            ) : (
              <Button type="button" variant="outline" onClick={() => void handleStart()} disabled={!canOpenQuiz}>
                Open quiz
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Time remaining</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
                {remainingSeconds === null ? "--:--" : formatTimeLeft(remainingSeconds)}
              </p>
            </div>
            <div className="rounded-xl border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Deadline</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(quiz.expiresAt)}</p>
            </div>
            <div className="rounded-xl border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Submission</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {submission?.submittedAt ? `Submitted ${formatDate(submission.submittedAt)}` : "Not submitted"}
              </p>
            </div>
          </div>

          {isClosed && hasOpenedQuiz && !submission ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Quiz closed</p>
              <p>You opened this quiz before the deadline, so a late PDF submission is still allowed.</p>
            </div>
          ) : null}

          {isClosed && !hasOpenedQuiz ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Quiz closed</p>
              <p>This quiz deadline has passed and it can no longer be opened.</p>
            </div>
          ) : null}

          {submission ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Submission successful</p>
                {submission.late ? <Badge variant="destructive">Late</Badge> : <Badge variant="secondary">On time</Badge>}
                {submission.graded ? <Badge variant="default">Graded</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Submitted at {formatDate(submission.submittedAt)}
                {submission.late ? `, ${formatLateBy(submission.lateBySeconds)}` : "."}
              </p>
              {submission.graded ? (
                <ScoreDisplay className="mt-4" score={submission.score ?? 0} feedback={submission.feedback} />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canViewQuiz && quiz.pdfs.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            {quiz.pdfs.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {quiz.pdfs.map((pdf, index) => (
                  <Button
                    key={pdf.id}
                    type="button"
                    variant={selectedPdfId === pdf.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => void handleSelectPdf(pdf.id)}
                  >
                    {pdf.fileName || `Quiz PDF ${index + 1}`}
                  </Button>
                ))}
              </div>
            ) : null}
            {pdfSrc ? (
              <QuizPdfViewer
                src={pdfSrc}
                title={quiz.pdfs.find((pdf) => pdf.id === selectedPdfId)?.fileName ?? quiz.title}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canSubmitQuiz ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Your answer</h2>
              <p className="mt-1 text-sm text-muted-foreground">Upload one PDF containing your completed work.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(event: ChangeEvent<HTMLInputElement>) => setAnswerFile(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
              <Button type="button" className="w-full md:w-auto" onClick={() => void handleSubmit()} disabled={!answerFile || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" aria-hidden="true" />
                    Submit quiz
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
