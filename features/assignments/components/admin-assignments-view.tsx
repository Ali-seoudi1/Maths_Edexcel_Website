"use client";

import { Edit3, FileText, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import { useToast } from "@/components/ui/toast";

import { deleteAdminAssignment, listAdminAssignments } from "../services/assignment-service";
import type { Assignment } from "../types";

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

export function AdminAssignmentsView() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const result = await listAdminAssignments();
      setAssignments(result.assignments);
    } catch (error) {
      toast({
        title: "Could not load assignments",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      await deleteAdminAssignment(deleteTarget.id);
      setAssignments((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({
        title: "Assignment deleted",
        description: "The assignment and uploaded student work were removed.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading assignments
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments yet"
        description="Upload the first assignment PDF here for students to view and submit their work."
        icon={<FileText className="h-8 w-8" aria-hidden="true" />}
        actionLabel="Create assignment"
        onAction={() => {
          window.location.href = "/admin/assignments/new";
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="shadow-soft">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{assignment.title}</h2>
                <Badge variant="secondary">PDF</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{assignment.description}</p>
              <p className="text-sm font-medium text-foreground">
                Deadline: {formatDate(assignment.deadline)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="icon" aria-label="Edit assignment">
                <Link href={`/admin/assignments/${assignment.id}`}>
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Delete assignment"
                onClick={() => setDeleteTarget(assignment)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete assignment</DialogTitle>
            <DialogDescription>
              This removes the assignment and will also delete any submitted student work tied to
              it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
