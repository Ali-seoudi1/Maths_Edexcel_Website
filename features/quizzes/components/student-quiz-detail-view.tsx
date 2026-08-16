"use client";

import { AlertTriangle, Clock3, FileQuestion, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

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
  getQuizAuthToken,
  getProtectedQuizFeedbackPdfSrc,
  getProtectedQuizPdfDownloadSrc,
  getProtectedQuizPdfSrc,
  getQuiz,
  markQuizNoSubmission,
  markQuizNoSubmissionWithToken,
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
  const authTokenRef = useRef("");
  const abandonArmedRef = useRef(false);
  const hasSubmissionRef = useRef(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    void Promise.all([getQuiz(quizId), getMyQuizSubmission(quizId), getQuizAuthToken()])
      .then(async ([quizResult, submissionResult, token]) => {
        if (!mounted) return;

        const canRestoreQuizAccess = Boolean(submissionResult.attempt);
        const hasFinalRecord = Boolean(submissionResult.submission);
        const firstPdfId =
          canRestoreQuizAccess && !hasFinalRecord ? (quizResult.quiz.pdfs[0]?.id ?? "") : "";
        const protectedPdfSrc = firstPdfId ? await getProtectedQuizPdfSrc(quizId, firstPdfId) : "";

        authTokenRef.current = token;
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
  const isScheduled = quiz?.status === "scheduled";
  const hasOpenedQuiz = Boolean(attempt);
  const hasFinalSubmission = Boolean(submission);
  const canOpenQuiz = Boolean(quiz) && !isClosed && !isScheduled && !hasOpenedQuiz && !hasFinalSubmission;
  const canViewQuiz = hasOpenedQuiz && !submission;
  const canSubmitQuiz = canViewQuiz && !submission;
  const showQuizRuleNotice = canOpenQuiz || canViewQuiz;

  useEffect(() => {
    abandonArmedRef.current = canViewQuiz && !isSubmitting;
    hasSubmissionRef.current = Boolean(submission);
    isSubmittingRef.current = isSubmitting;
  }, [canViewQuiz, isSubmitting, submission]);

  const markCurrentQuizNoSubmission = useCallback(() => {
    if (!abandonArmedRef.current || hasSubmissionRef.current || isSubmittingRef.current) {
      return;
    }

    abandonArmedRef.current = false;

    const token = authTokenRef.current;

    if (token) {
      void markQuizNoSubmissionWithToken(quizId, token);
      return;
    }

    void markQuizNoSubmission(quizId).catch(() => undefined);
  }, [quizId]);

  useEffect(() => {
    return () => {
      markCurrentQuizNoSubmission();
    };
  }, [markCurrentQuizNoSubmission]);

  async function handleStart() {
    if (!quiz) return;

    if (!canOpenQuiz) {
      toast({
        title: isScheduled ? "Quiz is scheduled" : "Quiz is closed",
        description: isScheduled ? "This quiz is not available yet." : "This quiz can no longer be opened.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await startQuiz(quiz.id);
      const firstPdfId = result.quiz.pdfs[0]?.id ?? "";
      const protectedPdfSrc = firstPdfId ? await getProtectedQuizPdfSrc(quiz.id, firstPdfId) : "";

      authTokenRef.current = await getQuizAuthToken();
      setQuiz(result.quiz);
      setAttempt(result.attempt);
      setSelectedPdfId(firstPdfId);
      setPdfSrc(protectedPdfSrc);
      setServerOffset(new Date(result.serverNow).getTime() - Date.now());
      toast({
        title: "Quiz opened",
        description: "Please submit your answers before the deadline.",
        variant: "success",
      });
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
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const result = await submitQuizPdf(quiz.id, answerFile);
      abandonArmedRef.current = false;
      hasSubmissionRef.current = true;
      setSubmission(result.submission);
      setAnswerFile(null);
      toast({
        title: "Submission successful",
        description: result.submission.late
          ? `Marked late by ${formatLateBy(result.submission.lateBySeconds)}.`
          : "Submitted on time.",
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
      isSubmittingRef.current = false;
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
                <h1 className="text-2xl font-semibold tracking-normal text-foreground">
                  {quiz.title}
                </h1>
                <Badge variant={isClosed ? "outline" : "secondary"}>
                  {isClosed ? "Closed" : isScheduled ? "Scheduled" : "Active"}
                </Badge>
              </div>
              {quiz.description ? (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {quiz.description}
                </p>
              ) : null}
            </div>
            {hasFinalSubmission ? (
              <Badge variant="outline">Closed</Badge>
            ) : hasOpenedQuiz ? (
              <Badge variant="secondary">Opened</Badge>
            ) : (
              <Button
                type="button"
                className="bg-amber-500 text-white shadow-md hover:bg-amber-600"
                onClick={() => void handleStart()}
                disabled={!canOpenQuiz}
              >
                {isScheduled ? "Scheduled" : "Open quiz"}
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
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {isScheduled ? "Starts" : "Deadline"}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(isScheduled ? quiz.publishedAt : quiz.expiresAt)}
              </p>
            </div>
            <div className="rounded-xl border bg-secondary/30 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">Submission</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {submission?.submittedAt
                  ? `Submitted ${formatDate(submission.submittedAt)}`
                  : "Not submitted"}
              </p>
            </div>
          </div>

          {isClosed && hasOpenedQuiz && !submission ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Quiz closed</p>
              <p>
                You opened this quiz before the deadline, so a late PDF submission is still allowed.
              </p>
            </div>
          ) : null}

          {showQuizRuleNotice ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Important quiz rule</p>
                  <p className="mt-1 leading-6">
                    If you leave this quiz page or press back before submitting your PDF solution,
                    this will be considered cheating. The quiz will be marked as no solution
                    (cheating) with a score of 0 and you will not be able to open it again. Opening
                    another tab is allowed only if you need to download your quiz solution file for
                    upload.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isClosed && !hasOpenedQuiz ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Quiz closed</p>
              <p>This quiz deadline has passed and it can no longer be opened.</p>
            </div>
          ) : null}

          {isScheduled ? (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
              <p className="font-semibold">Quiz scheduled</p>
              <p>This quiz will become available at {formatDate(quiz.publishedAt)}.</p>
            </div>
          ) : null}

          {submission ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {submission.noSubmission ? "No solution (cheating)" : "Submission successful"}
                </p>
                {submission.noSubmission ? null : submission.late ? (
                  <span className="text-sm font-semibold text-destructive">Late</span>
                ) : (
                  <Badge variant="secondary">On time</Badge>
                )}
                {submission.feedbackReturned ? <Badge variant="default">Feedback returned</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {submission.noSubmission
                  ? "You violated the quiz rule before submitting a solution."
                  : `Submitted at ${formatDate(submission.submittedAt)}${
                      submission.late ? `, ${formatLateBy(submission.lateBySeconds)}` : "."
                    }`}
              </p>
              {submission.feedbackReturned ? (
                <>
                  <ScoreDisplay
                    className="mt-4"
                    score={submission.score ?? 0}
                    maxScore={quiz.maxScore}
                    feedback={submission.feedback}
                  />
                  {submission.correctedPdfFileName ? (
                    <Button asChild className="mt-4" variant="outline">
                      <a href={getProtectedQuizFeedbackPdfSrc(quiz.id, authTokenRef.current)}>
                        Download corrected paper
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : submission.graded ? (
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  Your teacher has graded this submission. Feedback has not been returned yet.
                </p>
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
                  <div key={pdf.id} className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedPdfId === pdf.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => void handleSelectPdf(pdf.id)}
                    >
                      {pdf.fileName || `Quiz PDF ${index + 1}`}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={getProtectedQuizPdfDownloadSrc(quizId, pdf.id, authTokenRef.current)}>
                        Download PDF
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            {quiz.pdfs.length === 1 && selectedPdfId ? (
              <Button asChild variant="outline" size="sm">
                <a href={getProtectedQuizPdfDownloadSrc(quizId, selectedPdfId, authTokenRef.current)}>
                  Download PDF
                </a>
              </Button>
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
              <p className="mt-1 text-sm text-muted-foreground">
                Upload one PDF containing your completed work.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAnswerFile(event.target.files?.[0] ?? null)
                }
                disabled={isSubmitting}
              />
              <Button
                type="button"
                className="w-full md:w-auto"
                onClick={() => void handleSubmit()}
                disabled={!answerFile || isSubmitting}
              >
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
