"use client";

import { BookOpen, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { listPublishedLessonCatalog } from "../services/lesson-service";
import type { Chapter, Lesson } from "../types";

export function StudentLessonsView() {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeChapterId, setActiveChapterId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listPublishedLessonCatalog()
      .then((result) => {
        setChapters(result.chapters);
        setLessons(result.lessons);
        setActiveChapterId(result.chapters[0]?.id ?? "");
      })
      .catch((error) => {
        toast({
          title: "Could not load lessons",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const visibleLessons = useMemo(
    () => lessons.filter((lesson) => lesson.chapterId === activeChapterId),
    [activeChapterId, lessons],
  );

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <EmptyState
        title="No lessons available"
        description="Published lesson PDFs will appear here after the teacher uploads them."
        icon={<BookOpen className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <Card className="h-fit lg:sticky lg:top-28">
        <CardContent className="p-3">
          <div className="px-2 py-2">
            <p className="text-sm font-semibold text-foreground">Topics</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Select a topic to view its lesson PDFs.</p>
          </div>
          <div className="mt-2 space-y-1.5">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeChapterId === chapter.id
                    ? "border-primary/20 bg-primary/10 text-primary shadow-soft"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/70 hover:text-foreground",
                )}
                onClick={() => setActiveChapterId(chapter.id)}
              >
                <span className="font-semibold">{chapter.name}</span>
                {chapter.description ? <span className="mt-1 block text-xs leading-5">{chapter.description}</span> : null}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {chapters.find((chapter) => chapter.id === activeChapterId)?.name ?? "Lessons"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Lesson PDFs and solved examples for this topic.
              </p>
            </div>
            <Badge variant="secondary">
              {visibleLessons.length} lesson{visibleLessons.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="space-y-3">
        {visibleLessons.length === 0 ? (
          <EmptyState
            title="No lessons in this topic"
            description="Published lesson PDFs for this topic will appear here."
            icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          visibleLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="grid gap-4 rounded-xl border bg-background p-4 transition-all hover:-translate-y-0.5 hover:shadow-card sm:grid-cols-[1fr_auto] sm:items-center"
            >
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{lesson.title}</h2>
                      <Badge variant="secondary">
                        {lesson.pdfs.length} PDF{lesson.pdfs.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {lesson.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {lesson.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button asChild className="w-full sm:w-auto">
                  <Link href={`/lessons/${lesson.id}`}>
                    Open lesson
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
          ))
        )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
