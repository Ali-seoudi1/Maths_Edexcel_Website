"use client";

import { Clock3, Eye, FileQuestion, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

import { deleteAdminExam, listAdminExams } from "../services/exam-service";
import type { Exam } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminExamListView() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmExam, setConfirmExam] = useState<Exam | null>(null);

  useEffect(() => {
    void listAdminExams()
      .then((result) => setExams(result.exams))
      .catch((error) => {
        toast({
          title: "Could not load exams",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleDelete() {
    if (!confirmExam) return;

    try {
      setDeletingId(confirmExam.id);
      await deleteAdminExam(confirmExam.id);
      setExams((current) => current.filter((exam) => exam.id !== confirmExam.id));
      setConfirmExam(null);
      toast({ title: "Exam deleted", variant: "success" });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <Skeleton className="h-72" />;
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        title="No exams yet"
        description="Create a PDF exam and publish it when students should begin."
        icon={<FileQuestion className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <>
      <Card className="shadow-soft">
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    <div>
                      <Link href={`/admin/exams/${exam.id}`} className="font-semibold text-foreground hover:text-primary">
                        {exam.title}
                      </Link>
                      {exam.description ? (
                        <p className="mt-1 max-w-lg text-xs text-muted-foreground">{exam.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {exam.pdfs.length} PDF{exam.pdfs.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.status === "active" ? "secondary" : "outline"}>{exam.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                      {exam.durationMinutes} min
                    </span>
                  </TableCell>
                  <TableCell>
                    {exam.status === "scheduled"
                      ? `Starts ${formatDate(exam.publishedAt)}`
                      : `Closes ${formatDate(exam.expiresAt)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/exams/${exam.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                      </Button>
                      {exam.status === "active" || exam.status === "closed" ? (
                        <Button type="button" variant="outline" size="sm" disabled>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Button>
                      ) : (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/exams/${exam.id}/edit`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Edit
                          </Link>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${exam.title}`}
                        onClick={() => setConfirmExam(exam)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmExam)} onOpenChange={(open) => !open && setConfirmExam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete exam?</DialogTitle>
            <DialogDescription>
              This removes the exam, its PDF, and any submitted answer PDFs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={Boolean(deletingId)}>
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
