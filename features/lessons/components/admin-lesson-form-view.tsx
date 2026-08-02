"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import type { LessonFormValues } from "../schemas";
import {
  createAdminLesson,
  getAdminLesson,
  listAdminChapters,
  updateAdminLesson,
} from "../services/lesson-service";
import type { Chapter, Lesson } from "../types";
import { LessonForm } from "./lesson-form";

type AdminLessonFormViewProps = {
  lessonId?: string;
};

export function AdminLessonFormView({ lessonId }: AdminLessonFormViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      listAdminChapters(),
      lessonId ? getAdminLesson(lessonId) : Promise.resolve(null),
    ])
      .then(([chapterResult, lessonResult]) => {
        setChapters(chapterResult.chapters);
        setLesson(lessonResult?.lesson ?? null);
      })
      .catch((error) => {
        toast({
          title: "Could not load lesson form",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [lessonId, toast]);

  async function handleSubmit(values: LessonFormValues, pdfFile?: File) {
    try {
      if (lessonId) {
        await updateAdminLesson(lessonId, values, pdfFile);
      } else {
        if (!pdfFile) {
          throw new Error("Upload a lesson PDF.");
        }

        await createAdminLesson(values, pdfFile);
      }

      toast({ title: lessonId ? "Lesson updated" : "Lesson created", variant: "success" });
      router.push("/admin/lessons");
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

  if (chapters.length === 0) {
    return (
      <EmptyState
        title="Create a chapter first"
        description="Lessons must reference an existing chapter."
      />
    );
  }

  if (lessonId && !lesson) {
    return <EmptyState title="Lesson not found" description="This lesson could not be loaded." />;
  }

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle>Lesson details</CardTitle>
      </CardHeader>
      <CardContent>
        <LessonForm
          chapters={chapters}
          lesson={lesson ?? undefined}
          requiresPdf={!lessonId}
          submitLabel={lessonId ? "Save lesson" : "Create lesson"}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
