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
  getMyExamSubmission,
  getExamAuthToken,
  getProtectedExamPdfSrc,
  getExam,
  markExamNoSubmission,
  markExamNoSubmissionWithToken,
  startExam,
  submitExamPdf,
} from "../services/exam-service";
import type { Exam, ExamAttempt, ExamSubmission } from "../types";
import { ExamPdfViewer } from "./exam-pdf-viewer";

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

export function StudentExamDetailView({ examId }: { examId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
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

    void Promise.all([getExam(examId), getMyExamSubmission(examId), getExamAuthToken()])
      .then(async ([examResult, submissionResult, token]) => {
        if (!mounted) return;

        const canRestoreExamAccess = Boolean(submissionResult.attempt);
        const hasFinalRecord = Boolean(submissionResult.submission);
        const firstPdfId = canRestoreExamAccess && !hasFinalRecord ? (examResult.exam.pdfs[0]?.id ?? "") : "";
        const protectedPdfSrc = firstPdfId ? await getProtectedExamPdfSrc(examId, firstPdfId) : "";

        authTokenRef.current = token;
        setExam(examResult.exam);
        setAttempt(submissionResult.attempt);
        setSubmission(submissionResult.submission);
        setSelectedPdfId(firstPdfId);
        setPdfSrc(protectedPdfSrc);
        setServerOffset(new Date(examResult.serverNow).getTime() - Date.now());
      })
      .catch((error) => {
        console.error("[exam] failed to load exam view", error);
        toast({
          title: "Could not load exam",
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
  }, [examId, toast]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!exam?.expiresAt) return null;

    const serverNow = now + serverOffset;
    return Math.max(0, Math.ceil((new Date(exam.expiresAt).getTime() - serverNow) / 1000));
  }, [now, exam?.expiresAt, serverOffset]);

  const isClosed = remainingSeconds === 0 || exam?.status === "closed";
  const hasOpenedExam = Boolean(attempt);
  const hasFinalSubmission = Boolean(submission);
  const canOpenExam = Boolean(exam) && !isClosed && !hasOpenedExam && !hasFinalSubmission;
  const canViewExam = hasOpenedExam && !submission;
  const canSubmitExam = canViewExam && !submission;
  const showExamRuleNotice = canOpenExam || canViewExam;

  useEffect(() => {
    abandonArmedRef.current = canViewExam && !isSubmitting;
    hasSubmissionRef.current = Boolean(submission);
    isSubmittingRef.current = isSubmitting;
  }, [canViewExam, isSubmitting, submission]);

  const markCurrentExamNoSubmission = useCallback(() => {
    if (!abandonArmedRef.current || hasSubmissionRef.current || isSubmittingRef.current) {
      return;
    }

    abandonArmedRef.current = false;

    const token = authTokenRef.current;

    if (token) {
      void markExamNoSubmissionWithToken(examId, token);
      return;
    }

    void markExamNoSubmission(examId).catch(() => undefined);
  }, [examId]);

  useEffect(() => {
    return () => {
      markCurrentExamNoSubmission();
    };
  }, [markCurrentExamNoSubmission]);

  async function handleStart() {
    if (!exam) return;

    if (!canOpenExam) {
      toast({
        title: "Exam is closed",
        description: "This exam can no longer be opened.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await startExam(exam.id);
      const firstPdfId = result.exam.pdfs[0]?.id ?? "";
      const protectedPdfSrc = firstPdfId ? await getProtectedExamPdfSrc(exam.id, firstPdfId) : "";

      authTokenRef.current = await getExamAuthToken();
      setExam(result.exam);
      setAttempt(result.attempt);
      setSelectedPdfId(firstPdfId);
      setPdfSrc(protectedPdfSrc);
      setServerOffset(new Date(result.serverNow).getTime() - Date.now());
      toast({
        title: "Exam opened",
        description: "Please submit your answers before the deadline.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Could not open exam",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleSelectPdf(pdfId: string) {
    if (!canViewExam) return;

    setSelectedPdfId(pdfId);
    setPdfSrc(await getProtectedExamPdfSrc(examId, pdfId));
  }

  async function handleSubmit() {
    if (!exam || !answerFile || isSubmitting) return;

    if (!canSubmitExam) {
      toast({
        title: "Exam submission unavailable",
        description: "Open the exam before submitting your answer.",
        variant: "destructive",
      });
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      const result = await submitExamPdf(exam.id, answerFile);
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
      router.push("/exams");
    } catch (error) {
      toast({
        title: "Could not submit exam",
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

  if (!exam) {
    return (
      <EmptyState
        title="Exam not found"
        description="This exam is not available."
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
                  {exam.title}
                </h1>
                <Badge variant={isClosed ? "outline" : "secondary"}>
                  {isClosed ? "Closed" : "Active"}
                </Badge>
              </div>
              {exam.description ? (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  {exam.description}
                </p>
              ) : null}
            </div>
            {hasFinalSubmission ? (
              <Badge variant="outline">Closed</Badge>
            ) : hasOpenedExam ? (
              <Badge variant="secondary">Opened</Badge>
            ) : (
              <Button
                type="button"
                className="bg-amber-500 text-white shadow-md hover:bg-amber-600"
                onClick={() => void handleStart()}
                disabled={!canOpenExam}
              >
                Open exam
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
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(exam.expiresAt)}
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

          {isClosed && hasOpenedExam && !submission ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Exam closed</p>
              <p>
                You opened this exam before the deadline, so a late PDF submission is still allowed.
              </p>
            </div>
          ) : null}

          {showExamRuleNotice ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Important exam rule</p>
                  <p className="mt-1 leading-6">
                    If you leave this exam page, go to another page, or press back before
                    submitting your PDF solution, this will be considered cheating. The exam will
                    be marked as no solution (cheating) with a score of 0 and you will not be able
                    to open it again. Opening another tab is allowed only if you need to download
                    or prepare your exam solution file for upload.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {isClosed && !hasOpenedExam ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Exam closed</p>
              <p>This exam deadline has passed and it can no longer be opened.</p>
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
                {submission.graded ? <Badge variant="default">Graded</Badge> : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {submission.noSubmission
                  ? "You violated the exam rule before submitting a solution."
                  : `Submitted at ${formatDate(submission.submittedAt)}${
                      submission.late ? `, ${formatLateBy(submission.lateBySeconds)}` : "."
                    }`}
              </p>
              {submission.graded ? (
                <ScoreDisplay
                  className="mt-4"
                  score={submission.score ?? 0}
                  maxScore={exam.maxScore}
                  feedback={submission.feedback}
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canViewExam && exam.pdfs.length > 0 ? (
        <Card>
          <CardContent className="space-y-4 p-4">
            {exam.pdfs.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {exam.pdfs.map((pdf, index) => (
                  <Button
                    key={pdf.id}
                    type="button"
                    variant={selectedPdfId === pdf.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => void handleSelectPdf(pdf.id)}
                  >
                    {pdf.fileName || `Exam PDF ${index + 1}`}
                  </Button>
                ))}
              </div>
            ) : null}
            {pdfSrc ? (
              <ExamPdfViewer
                src={pdfSrc}
                title={exam.pdfs.find((pdf) => pdf.id === selectedPdfId)?.fileName ?? exam.title}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canSubmitExam ? (
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
                    Submit exam
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
