"use client";

import { Eye, FileText, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getFirebaseAuth } from "@/lib/firebase/client";

import {
  deleteMyAssignmentSubmissionPdf,
  listAssignments,
  submitAssignmentSolution,
} from "../services/assignment-service";
import type { Assignment, AssignmentSubmission } from "../types";

type AssignmentFilter = "all" | "submitted" | "unsubmitted";

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isPast(value: string | null) {
  return Boolean(value && Date.now() > new Date(value).getTime());
}

function getPercentage(score: number, maxScore: number) {
  const safeMaxScore = maxScore > 0 ? maxScore : 100;
  return Math.max(0, Math.min(100, Math.round((score / safeMaxScore) * 100)));
}

function getScoreToneClass(percentage: number | null) {
  if (percentage === null) return "text-muted-foreground";
  if (percentage >= 75) return "text-emerald-700";
  if (percentage >= 50) return "text-amber-700";
  return "text-destructive";
}

function getScoreCardToneClass(percentage: number | null) {
  if (percentage === null) return "";
  if (percentage >= 75) {
    return "border-l-emerald-500 bg-gradient-to-r from-emerald-100 via-emerald-50/80 to-card";
  }
  if (percentage >= 50) {
    return "border-l-amber-500 bg-gradient-to-r from-amber-100 via-amber-50/80 to-card";
  }
  return "border-l-destructive bg-gradient-to-r from-destructive/10 via-red-50/80 to-card";
}

export function StudentAssignmentsView() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission | null>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    assignmentId: string;
    pdfId: string;
    fileName: string;
  } | null>(null);
  const [confirmUploadId, setConfirmUploadId] = useState<string | null>(null);

  useEffect(() => {
    void listAssignments()
      .then((assignmentResult) => {
        const items = assignmentResult.assignments;
        setAssignments(items);

        const nextSubmissions = Object.fromEntries(
          items.map((assignment) => [
            assignment.id,
            assignmentResult.submissions.find(
              (submission) => submission.assignmentId === assignment.id,
            ) ?? null,
          ]),
        );

        setSubmissions(nextSubmissions);
      })
      .catch((error) => {
        toast({
          title: "Could not load assignments",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const submissionMap = useMemo(() => submissions, [submissions]);

  async function handleUpload(assignmentId: string, files: File[]) {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Choose at least one PDF before submitting.",
        variant: "destructive",
      });
      return;
    }

    setUploadingId(assignmentId);

    try {
      const result = await submitAssignmentSolution(assignmentId, files);
      setSubmissions((prev) => ({ ...prev, [assignmentId]: result.submission }));
      setSelectedFiles((prev) => ({ ...prev, [assignmentId]: [] }));
      toast({
        title: "Solution submitted",
        description: result.submission.isLate
          ? "Submitted late - marked as late."
          : "Your solution has been submitted.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDeleteSubmissionPdf(assignmentId: string, pdfId: string) {
    setUploadingId(assignmentId);

    try {
      const result = await deleteMyAssignmentSubmissionPdf(assignmentId, pdfId);
      setSubmissions((prev) => ({ ...prev, [assignmentId]: result.submission }));
      toast({
        title: "PDF deleted",
        description: result.submission
          ? "The selected PDF was removed from your submission."
          : "Your submission was removed because no PDFs are left.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
      setUploadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments available"
        description="Your teacher has not published any assignments yet."
        icon={<FileText className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your assignments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View task PDFs, submit your solution, and check feedback after grading.
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
              onClick={() => setFilter(item.value as AssignmentFilter)}
              showPendingOnPress={false}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {assignments
        .filter((assignment) => {
          const submission = submissionMap[assignment.id] ?? null;
          const isSubmitted = Boolean(submission && !submission.noSubmission);

          if (filter === "submitted") return isSubmitted;
          if (filter === "unsubmitted") return !isSubmitted;
          return true;
        })
        .map((assignment) => {
        const submission = submissionMap[assignment.id] ?? null;
        const pendingFiles = selectedFiles[assignment.id] ?? [];
        const isGraded = typeof submission?.grade === "number";
        const isMissingSubmission = !submission && isPast(assignment.deadline);
        const percentage = isGraded ? getPercentage(submission.grade ?? 0, assignment.maxGrade) : null;
        const scoreTone = getScoreToneClass(percentage);
        const statusTone = isGraded
          ? getScoreCardToneClass(percentage)
          : submission?.isLate || isMissingSubmission
            ? "border-l-destructive bg-gradient-to-r from-destructive/10 to-card"
            : submission
              ? "border-l-emerald-500 bg-gradient-to-r from-emerald-100/80 via-emerald-50/70 to-card"
              : "border-l-primary bg-gradient-to-r from-primary/5 to-card";
        return (
          <Card
            key={assignment.id}
            className={`overflow-hidden border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${statusTone}`}
          >
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">{assignment.title}</h2>
                        {submission?.isLate ? (
                        <span className="text-sm font-semibold text-destructive">Late</span>
                      ) : submission ? (
                        <Badge variant="secondary">On time</Badge>
                      ) : isMissingSubmission ? (
                        <Badge variant="outline">No submission</Badge>
                      ) : (
                        <Badge variant="secondary">Not submitted</Badge>
                      )}
                    </div>
                    {assignment.description ? (
                      <div className="max-w-3xl rounded-xl border bg-white/80 px-3 py-2 text-sm leading-6 text-foreground shadow-sm">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Task description</p>
                        <p className="mt-1 whitespace-pre-wrap">{assignment.description}</p>
                      </div>
                    ) : null}
                    <p className="text-xs font-medium text-muted-foreground">
                      Deadline: {formatDate(assignment.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:justify-end">
                  {percentage !== null ? (
                    <div className={`text-right ${scoreTone}`}>
                      <p className="text-sm font-bold">
                        {submission?.grade ?? 0}/{assignment.maxGrade}
                      </p>
                      <p className="text-xs font-semibold">{percentage}%</p>
                    </div>
                  ) : (
                    <div className="text-right text-muted-foreground">
                      <p className="text-sm font-bold">0/{assignment.maxGrade}</p>
                      <p className="text-xs font-semibold">
                        {isMissingSubmission ? "No submission" : "Not graded"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {assignment.pdfs.length > 0 ? (
                    assignment.pdfs.map((pdf) => (
                      <Button
                        key={pdf.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const token = await getFirebaseAuth().currentUser?.getIdToken();
                          const params = new URLSearchParams({
                            token: token ?? "",
                            pdfId: pdf.id,
                          });
                          window.open(
                            `/api/assignments/${assignment.id}/pdf?${params.toString()}`,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View task
                      </Button>
                    ))
                  ) : null}
                </div>
              </div>

              {isGraded && submission?.feedback ? (
                <div className="rounded-xl border bg-white/70 p-3 text-sm leading-6 text-muted-foreground">
                  <span className="font-semibold text-foreground">Feedback: </span>
                  {submission.feedback}
                </div>
              ) : null}

              <div className="rounded-xl border bg-white/70 p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">Your submission</p>
                    <p className="text-xs text-muted-foreground">
                      {submission
                        ? `Submitted ${formatDate(submission.submittedAt)} with ${submission.pdfs.length} PDF${
                            submission.pdfs.length === 1 ? "" : "s"
                          }`
                        : isMissingSubmission
                          ? "No submission yet. A late PDF can still be uploaded."
                        : "Not submitted yet"}
                    </p>
                    {submission?.pdfs.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {submission.pdfs.map((pdf) => (
                          <div key={pdf.id} className="flex min-w-0 flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-w-0 max-w-full"
                              onClick={async () => {
                                const token = await getFirebaseAuth().currentUser?.getIdToken();
                                const params = new URLSearchParams({
                                  token: token ?? "",
                                  pdfId: pdf.id,
                                });
                                window.open(
                                  `/api/assignments/${assignment.id}/submission-pdf?${params.toString()}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              <span className="truncate">{pdf.fileName}</span>
                            </Button>
                            {!isGraded ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingId === assignment.id}
                                onClick={() =>
                                  setDeleteTarget({
                                    assignmentId: assignment.id,
                                    pdfId: pdf.id,
                                    fileName: pdf.fileName,
                                  })
                                }
                              >
                                Delete
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {!isGraded ? (
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                      <Input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          setSelectedFiles((prev) => ({
                            ...prev,
                            [assignment.id]: [...(prev[assignment.id] ?? []), ...files],
                          }));
                          event.target.value = "";
                        }}
                        disabled={uploadingId === assignment.id}
                      />
                      <Button
                        type="button"
                        className="sm:w-auto"
                        disabled={uploadingId === assignment.id || pendingFiles.length === 0}
                        onClick={() => setConfirmUploadId(assignment.id)}
                      >
                        Upload
                      </Button>
                      {uploadingId === assignment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="hidden h-4 w-4 text-muted-foreground sm:block" />
                      )}
                    </div>
                  ) : null}
                </div>
                {!isGraded && pendingFiles.length > 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Selected: {pendingFiles.map((file) => file.name).join(", ")}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {assignments.filter((assignment) => {
        const submission = submissionMap[assignment.id] ?? null;
        const isSubmitted = Boolean(submission && !submission.noSubmission);

        if (filter === "submitted") return isSubmitted;
        if (filter === "unsubmitted") return !isSubmitted;
        return true;
      }).length === 0 ? (
        <EmptyState
          title={filter === "submitted" ? "No submitted assignments" : "No unsubmitted assignments"}
          description="Switch filters to view the rest of your assignments."
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
        />
      ) : null}

      <Dialog
        open={Boolean(confirmUploadId)}
        onOpenChange={(open) => !open && setConfirmUploadId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload submission?</DialogTitle>
            <DialogDescription>
              This will submit the selected PDF files for this assignment. You can delete and
              upload again later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmUploadId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!confirmUploadId) {
                  return;
                }

                const files = selectedFiles[confirmUploadId] ?? [];
                setConfirmUploadId(null);
                void handleUpload(confirmUploadId, files);
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this PDF?</DialogTitle>
            <DialogDescription>
              This removes {deleteTarget?.fileName ?? "the selected PDF"} from your submission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  void handleDeleteSubmissionPdf(deleteTarget.assignmentId, deleteTarget.pdfId);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
