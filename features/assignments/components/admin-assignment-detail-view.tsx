"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

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

    if (
      parsedGrade !== null &&
      (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100)
    ) {
      toast({
        title: "Invalid grade",
        description: "Enter a grade between 0 and 100.",
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
            <Badge variant="secondary">PDF assignment</Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{assignment.description}</p>
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
                          <Badge variant="destructive">Late</Badge>
                        ) : (
                          <Badge variant="secondary">On time</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.pdfFileName || "No file name"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                    <label className="text-sm font-medium text-foreground">Grade</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.grade}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { grade: "", feedback: "" }),
                            grade: event.target.value,
                          },
                        }))
                      }
                      placeholder="0-100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[140px_1fr] md:items-start">
                    <label className="text-sm font-medium text-foreground">Feedback</label>
                    <textarea
                      value={draft.feedback}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        setDrafts((current) => ({
                          ...current,
                          [submission.id]: {
                            ...(current[submission.id] ?? { grade: "", feedback: "" }),
                            feedback: event.target.value,
                          },
                        }))
                      }
                      placeholder="Add feedback for the student"
                      rows={4}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void handleSave(submission.id)}
                      disabled={savingId === submission.id}
                    >
                      {savingId === submission.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        "Save grade"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
