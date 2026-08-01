"use client";

import { Edit3, FileQuestion, Loader2, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

import { examSessionLabels } from "../constants";
import { deleteModelAnswer, listModelAnswers } from "../services/model-answer-service";
import type { ExamSession, ModelAnswer } from "../types";

function formatDate(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminModelAnswersView() {
  const [modelAnswers, setModelAnswers] = useState<ModelAnswer[]>([]);
  const [search, setSearch] = useState("");
  const [examYear, setExamYear] = useState("");
  const [session, setSession] = useState<ExamSession | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ModelAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadModelAnswers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listModelAnswers({
        examYear: examYear ? Number(examYear) : undefined,
        session: session === "all" ? undefined : session,
      });
      setModelAnswers(response.modelAnswers);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Model answers could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [examYear, session]);

  useEffect(() => {
    void loadModelAnswers();
  }, [loadModelAnswers]);

  const visibleModelAnswers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return modelAnswers;
    }

    return modelAnswers.filter((modelAnswer) =>
      [
        String(modelAnswer.examYear),
        examSessionLabels[modelAnswer.session],
        modelAnswer.paper,
        modelAnswer.questionNumber,
        modelAnswer.officialMarkSchemeFileName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [modelAnswers, search]);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteModelAnswer(deleteTarget.id);
      setModelAnswers((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({
        title: "Model answer deleted",
        description: "The model answer has been removed.",
        variant: "success",
      });
    } catch (deleteError) {
      toast({
        title: "Delete failed",
        description:
          deleteError instanceof Error ? deleteError.message : "The model answer was not deleted.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl shadow-card">
        <CardHeader>
          <CardTitle>Search and filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search year, paper, question, file"
              />
            </div>
            <Input
              type="number"
              value={examYear}
              onChange={(event) => setExamYear(event.target.value)}
              placeholder="Exam year"
            />
            <select
              value={session}
              onChange={(event) => setSession(event.target.value as ExamSession | "all")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All sessions</option>
              {Object.entries(examSessionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading model answers
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState title="Model answers could not load" description={error} />
            </div>
          ) : visibleModelAnswers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No model answers found"
                description="Create the first model answer or adjust the current filters."
                icon={<FileQuestion className="h-10 w-10" aria-hidden="true" />}
                actionLabel="Create model answer"
                onAction={() => {
                  window.location.href = "/admin/model-answers/new";
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Mark Scheme</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleModelAnswers.map((modelAnswer) => (
                    <TableRow key={modelAnswer.id}>
                      <TableCell>
                        <p className="font-semibold text-foreground">
                          {modelAnswer.examYear} {examSessionLabels[modelAnswer.session]}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Paper {modelAnswer.paper} · Question {modelAnswer.questionNumber}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-56">
                        <p className="truncate text-sm text-muted-foreground">
                          {modelAnswer.officialMarkSchemeFileName}
                        </p>
                      </TableCell>
                      <TableCell>{formatDate(modelAnswer.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="icon" aria-label="Edit">
                            <Link href={`/admin/model-answers/${modelAnswer.id}`}>
                              <Edit3 className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Delete"
                            onClick={() => setDeleteTarget(modelAnswer)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete model answer</DialogTitle>
            <DialogDescription>
              This removes the model answer record. The action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
