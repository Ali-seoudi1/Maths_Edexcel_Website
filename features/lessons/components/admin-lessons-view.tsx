"use client";

import { Eye, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

import {
  deleteAdminLesson,
  listAdminChapters,
  listAdminLessons,
} from "../services/lesson-service";
import type { Chapter, Lesson } from "../types";

export function AdminLessonsView() {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  const loadData = useCallback(async (nextChapterId = chapterId) => {
    setLoading(true);

    try {
      const [chapterResult, lessonResult] = await Promise.all([
        listAdminChapters(),
        listAdminLessons(nextChapterId || undefined),
      ]);
      setChapters(chapterResult.chapters);
      setLessons(lessonResult.lessons);
    } catch (error) {
      toast({
        title: "Could not load lessons",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [chapterId, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return lessons;
    }

    return lessons.filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(normalizedQuery) ||
        lesson.description.toLowerCase().includes(normalizedQuery) ||
        lesson.chapterName?.toLowerCase().includes(normalizedQuery),
    );
  }, [lessons, query]);

  async function handleChapterFilter(value: string) {
    setChapterId(value);
    await loadData(value);
  }

  async function handleDelete() {
    if (!lessonToDelete) {
      return;
    }

    try {
      await deleteAdminLesson(lessonToDelete.id);
      toast({ title: "Lesson deleted", variant: "success" });
      setLessonToDelete(null);
      await loadData();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-soft">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px] lg:w-[620px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lessons"
              className="pl-9"
            />
          </div>
          <select
            value={chapterId}
            onChange={(event) => void handleChapterFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          >
            <option value="">All topics</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <EmptyState
          title="No lessons found"
          description="Upload PDF lesson notes after teaching each lesson."
          icon={<Search className="h-8 w-8" aria-hidden="true" />}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{lesson.title}</p>
                      {lesson.description ? (
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lesson.pdfs.length} PDF{lesson.pdfs.length === 1 ? "" : "s"}
                      </p>
                    </TableCell>
                    <TableCell>{lesson.chapterName ?? lesson.chapterId}</TableCell>
                    <TableCell>
                      <Badge variant={lesson.published ? "secondary" : "outline"}>
                        {lesson.published ? "Published" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon" aria-label="View lesson">
                          <Link href={`/admin/lessons/${lesson.id}`}>
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Delete lesson"
                          onClick={() => setLessonToDelete(lesson)}
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
        </div>
      )}

      <Dialog open={Boolean(lessonToDelete)} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete lesson?</DialogTitle>
            <DialogDescription>
              This removes the lesson metadata and its PDF from Firebase Storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLessonToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
