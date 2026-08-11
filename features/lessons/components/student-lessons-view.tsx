"use client";

import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { listPublishedChapters, listPublishedLessons } from "../services/lesson-service";
import type { Chapter, Lesson } from "../types";

export function StudentLessonsView() {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeChapterId, setActiveChapterId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([listPublishedChapters(), listPublishedLessons()])
      .then(([chapterResult, lessonResult]) => {
        setChapters(chapterResult.chapters);
        setLessons(lessonResult.lessons);
        setActiveChapterId(chapterResult.chapters[0]?.id ?? "");
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
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
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
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit shadow-soft">
        <CardContent className="p-4">
          <p className="px-2 py-2 text-sm font-semibold text-foreground">Chapters</p>
          <div className="mt-2 space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-3 text-left text-sm transition-colors",
                  activeChapterId === chapter.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                onClick={() => setActiveChapterId(chapter.id)}
              >
                <span className="font-semibold">{chapter.name}</span>
                <span className="mt-1 block text-xs">{chapter.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {visibleLessons.length === 0 ? (
          <EmptyState
            title="No lessons in this chapter"
            description="Published lesson PDFs for this chapter will appear here."
            icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          />
        ) : (
          visibleLessons.map((lesson) => (
            <Card key={lesson.id} className="shadow-soft">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{lesson.title}</h2>
                      <Badge variant="secondary">
                        {lesson.pdfs.length} PDF{lesson.pdfs.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {lesson.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {lesson.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/lessons/${lesson.id}`}>Open lesson</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
