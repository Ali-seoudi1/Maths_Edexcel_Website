"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { SubmissionGradePanel } from "@/components/shared/submission-grade-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getFirebaseAuth } from "@/lib/firebase/client";

import {
  getAdminAssignment,
  listAssignmentSubmissions,
  updateAssignmentSubmissionGrade,
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

export function AdminAssignmentDetailView({ assignmentId }: { assignmentId: string }) {
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [editingSubmissionIds, setEditingSubmissionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void Promise.all([getAdminAssignment(assignmentId), listAssignmentSubmissions(assignmentId)])
      .then(([assignmentResult, submissionsResult]) => {
        setAssignment(assignmentResult.assignment);
        setSubmissions(submissionsResult.submissions);
        setDrafts(
          Object.fromEntries(
            submissionsResult.submissions.map((submission) => [
              submission.id,
              {
                grade: submission.grade === null ? "" : String(submission.grade),
                feedback: submission.feedback ?? "",
              },
            ]),
          ),
        );
        setEditingSubmissionIds(
          new Set(
            submissionsResult.submissions
              .filter((submission) => !submission.noSubmission && typeof submission.grade !== "number")
              .map((submission) => submission.id),
          ),
        );
      })
      .catch((error) => {
        toast({
          title: "Could not load assignment details",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [assignmentId, toast]);

  async function handleSave(submissionId: string) {
    const draft = drafts[submissionId];

    if (!draft) {
      return;
    }

    const rawGrade = draft.grade.trim();
    const parsedGrade = rawGrade === "" ? null : Number(rawGrade);
    const maxGrade = assignment?.maxGrade ?? 100;

    if (parsedGrade !== null && (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > maxGrade)) {
      toast({
        title: "Invalid grade",
        description: "Enter a grade between 0 and the total score.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingId(submissionId);
      const result = await updateAssignmentSubmissionGrade(assignmentId, submissionId, {
        grade: parsedGrade,
        feedback: draft.feedback,
      });

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === submissionId ? result.submission : submission,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [submissionId]: {
          grade: result.submission.grade === null ? "" : String(result.submission.grade),
          feedback: result.submission.feedback ?? "",
        },
      }));
      setEditingSubmissionIds((current) => {
        const next = new Set(current);
        next.delete(submissionId);
        return next;
      });
      toast({
        title: "Grade saved",
        description: "The student can now see their grade and feedback.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Grade update failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 max-w-5xl" />;
  }

  if (!assignment) {
    return (
      <EmptyState
        title="Assignment not found"
        description="This assignment is not available for grading."
        icon={<FileText className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{assignment.title}</h2>
            <Badge variant="secondary">
              {assignment.pdfs.length} PDF{assignment.pdfs.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {assignment.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{assignment.description}</p>
          ) : null}
          <p className="text-sm font-medium text-foreground">
            Deadline: {formatDate(assignment.deadline)}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Student submissions</h3>

        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Students will appear here once they upload their solution PDF."
            icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          submissions.map((submission) => {
            const draft = drafts[submission.id] ?? { grade: "", feedback: "" };
            const isEditingGrade = editingSubmissionIds.has(submission.id);

            return (
              <Card key={submission.id} className="shadow-soft">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground">
                          {submission.studentName}
                        </p>
                        {submission.isLate ? (
                          <span className="text-sm font-semibold text-destructive">Late</span>
                        ) : submission.noSubmission ? (
                          <Badge variant="outline">No submission</Badge>
                        ) : (
                          <Badge variant="secondary">On time</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {submission.noSubmission
                          ? "No PDF has been submitted."
                          : `Submitted ${formatDate(submission.submittedAt)}`}
                      </p>
                    </div>
                    {!submission.noSubmission ? (
                      <div className="flex flex-wrap gap-2">
                      {submission.pdfs.map((pdf) => (
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
                              `/api/admin/assignments/${assignmentId}/submissions/${
                                submission.id
                              }/pdf?${params.toString()}`,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                        >
                          {pdf.fileName}
                        </Button>
                      ))}
                      </div>
                    ) : null}
                  </div>

                  {!submission.noSubmission ? (
                    <SubmissionGradePanel
                      editing={isEditingGrade}
                      feedback={draft.feedback}
                      max={assignment.maxGrade}
                      maxScoreValue={String(assignment.maxGrade)}
                      saving={savingId === submission.id}
                      scoreLabel="Grade"
                      scorePlaceholder="Score"
                      scoreSummaryLabel="Grade"
                      scoreValue={draft.grade}
                      onEdit={() =>
                        setEditingSubmissionIds((current) => new Set(current).add(submission.id))
                      }
                      onFeedbackChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { grade: "", feedback: "" }),
                            feedback: value,
                          },
                        }))
                      }
                      onSave={() => void handleSave(submission.id)}
                      onScoreChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { grade: "", feedback: "" }),
                            grade: value,
                          },
                        }))
                      }
                    />
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
