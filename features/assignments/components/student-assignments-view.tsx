"use client";

import { FileText, Loader2, UploadCloud } from "lucide-react";
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
  getMyAssignmentSubmission,
  listAssignments,
  submitAssignmentSolution,
} from "../services/assignment-service";
import type { Assignment, AssignmentSubmission } from "../types";

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

export function StudentAssignmentsView() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission | null>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File[]>>({});
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
      .then(async (assignmentResult) => {
        const items = assignmentResult.assignments;
        setAssignments(items);

        const nextSubmissions: Record<string, AssignmentSubmission | null> = {};
        for (const assignment of items) {
          try {
            const found = await getMyAssignmentSubmission(assignment.id);
            nextSubmissions[assignment.id] = found.submission ?? null;
          } catch {
            nextSubmissions[assignment.id] = null;
          }
        }

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
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
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
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const submission = submissionMap[assignment.id] ?? null;
        const pendingFiles = selectedFiles[assignment.id] ?? [];
        const isGraded = typeof submission?.grade === "number";
        return (
          <Card key={assignment.id} className="shadow-soft">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{assignment.title}</h2>
                    <Badge variant="secondary">Assignment</Badge>
                    {submission?.isLate ? (
                      <Badge variant="destructive">Late</Badge>
                    ) : submission ? (
                      <Badge variant="secondary">On time</Badge>
                    ) : null}
                  </div>
                  {assignment.description ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {assignment.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Deadline: {formatDate(assignment.deadline)}
                  </p>
                  {submission?.grade !== null && typeof submission?.grade === "number" ? (
                    <p className="mt-2 text-sm font-medium text-success">
                      Grade: {submission.grade}/100
                    </p>
                  ) : null}
                  {submission?.feedback ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Feedback: {submission.feedback}
                    </p>
                  ) : null}
                </div>

                {assignment.pdfs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignment.pdfs.map((pdf) => (
                      <Button
                        key={pdf.id}
                        type="button"
                        variant="outline"
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
                        Open {pdf.fileName}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-md border bg-secondary/30 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Your submission</p>
                    <p className="text-xs text-muted-foreground">
                      {submission
                        ? `Submitted ${formatDate(submission.submittedAt)} with ${submission.pdfs.length} PDF${
                            submission.pdfs.length === 1 ? "" : "s"
                          }`
                        : "Not submitted yet"}
                    </p>
                    {submission?.pdfs.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {submission.pdfs.map((pdf) => (
                          <div key={pdf.id} className="flex flex-wrap items-center gap-2">
                            <Button
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
                                  `/api/assignments/${assignment.id}/submission-pdf?${params.toString()}`,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                            >
                              {pdf.fileName}
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                        disabled={uploadingId === assignment.id || pendingFiles.length === 0}
                        onClick={() => setConfirmUploadId(assignment.id)}
                      >
                        Upload
                      </Button>
                      {uploadingId === assignment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-muted-foreground" />
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
    </div>
  );
}
