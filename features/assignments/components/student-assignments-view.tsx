"use client";

import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getFirebaseAuth } from "@/lib/firebase/client";

import {
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
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

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

  async function handleUpload(assignmentId: string, file: File | undefined) {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Choose a PDF before submitting.",
        variant: "destructive",
      });
      return;
    }

    setUploadingId(assignmentId);

    try {
      const result = await submitAssignmentSolution(assignmentId, file);
      setSubmissions((prev) => ({ ...prev, [assignmentId]: result.submission }));
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
        const isPastDeadline = assignment.deadline
          ? new Date().getTime() > new Date(assignment.deadline).getTime()
          : false;

        return (
          <Card key={assignment.id} className="shadow-soft">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">{assignment.title}</h2>
                    <Badge variant="secondary">Assignment</Badge>
                    {submission?.isLate ? <Badge variant="destructive">Late</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {assignment.description}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Deadline: {formatDate(assignment.deadline)}
                  </p>
                  {submission?.grade !== null && typeof submission?.grade === "number" ? (
                    <p className="mt-2 text-sm font-medium text-success">
                      Grade: {submission.grade}/100
                    </p>
                  ) : submission?.feedback ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Feedback: {submission.feedback}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const token = await getFirebaseAuth().currentUser?.getIdToken();
                    window.open(
                      `/api/assignments/${assignment.id}/pdf?token=${encodeURIComponent(token ?? "")}`,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  Open PDF
                </Button>
              </div>

              <div className="rounded-md border bg-secondary/30 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Your submission</p>
                    <p className="text-xs text-muted-foreground">
                      {submission
                        ? `Submitted ${formatDate(submission.submittedAt)}`
                        : "Not submitted yet"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        void handleUpload(assignment.id, file);
                        event.target.value = "";
                      }}
                      disabled={uploadingId === assignment.id}
                    />
                    {uploadingId === assignment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
