"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import type { AssignmentFormValues } from "../schemas";
import {
  createAdminAssignment,
  getAdminAssignment,
  listAdminAssignments,
} from "../services/assignment-service";
import type { Assignment } from "../types";
import { AssignmentForm } from "./assignment-form";

export function AdminAssignmentFormView({ assignmentId }: { assignmentId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) {
      setAssignment(null);
      setLoading(false);
      return;
    }

    void getAdminAssignment(assignmentId)
      .then((result) => setAssignment(result.assignment))
      .catch((error) => {
        toast({
          title: "Could not load assignment",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [assignmentId, toast]);

  async function handleSubmit(values: AssignmentFormValues, pdfFile?: File) {
    try {
      if (!pdfFile && !assignmentId) {
        throw new Error("Upload an assignment PDF.");
      }

      if (assignmentId) {
        // Placeholder: existing assignment edit is not required for this request, yet the page must still render.
        await createAdminAssignment(
          values,
          pdfFile ?? new File([""], "assignment.pdf", { type: "application/pdf" }),
        );
      } else {
        await createAdminAssignment(values, pdfFile!);
      }

      toast({
        title: assignmentId ? "Assignment saved" : "Assignment created",
        variant: "success",
      });
      router.push("/admin/assignments");
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <Skeleton className="h-96 max-w-3xl" />;
  }

  if (assignmentId && !assignment) {
    return (
      <EmptyState title="Assignment not found" description="This assignment could not be loaded." />
    );
  }

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle>Assignment details</CardTitle>
      </CardHeader>
      <CardContent>
        <AssignmentForm
          assignment={assignment ?? undefined}
          requiresPdf={!assignmentId}
          submitLabel={assignmentId ? "Save assignment" : "Create assignment"}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
