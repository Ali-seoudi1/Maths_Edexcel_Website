"use client";

import { Clock3, FileQuestion, Loader2, Trash2 } from "lucide-react";
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

import { deleteAdminQuiz, listAdminQuizzes } from "../services/quiz-service";
import type { Quiz } from "../types";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminQuizListView() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmQuiz, setConfirmQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    void listAdminQuizzes()
      .then((result) => setQuizzes(result.quizzes))
      .catch((error) => {
        toast({
          title: "Could not load quizzes",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleDelete() {
    if (!confirmQuiz) return;

    try {
      setDeletingId(confirmQuiz.id);
      await deleteAdminQuiz(confirmQuiz.id);
      setQuizzes((current) => current.filter((quiz) => quiz.id !== confirmQuiz.id));
      setConfirmQuiz(null);
      toast({ title: "Quiz deleted", variant: "success" });
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

  if (quizzes.length === 0) {
    return (
      <EmptyState
        title="No quizzes yet"
        description="Create a PDF quiz and publish it when students should begin."
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
                <TableHead>Quiz</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Closes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <Link href={`/admin/quizzes/${quiz.id}`} className="font-semibold text-foreground hover:text-primary">
                        {quiz.title}
                      </Link>
                      {quiz.description ? (
                        <p className="mt-1 max-w-lg text-xs text-muted-foreground">{quiz.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {quiz.pdfs.length} PDF{quiz.pdfs.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={quiz.status === "active" ? "secondary" : "outline"}>{quiz.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                      {quiz.durationMinutes} min
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(quiz.expiresAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/quizzes/${quiz.id}`}>View</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${quiz.title}`}
                        onClick={() => setConfirmQuiz(quiz)}
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

      <Dialog open={Boolean(confirmQuiz)} onOpenChange={(open) => !open && setConfirmQuiz(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quiz?</DialogTitle>
            <DialogDescription>
              This removes the quiz, its PDF, and any submitted answer PDFs.
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
