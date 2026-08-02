"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { getFirebaseAuth } from "@/lib/firebase/client";

import { getPublishedLesson } from "../services/lesson-service";
import type { Lesson } from "../types";
import { PdfViewer } from "./pdf-viewer";

export function StudentLessonDetailView({ lessonId }: { lessonId: string }) {
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [pdfSrc, setPdfSrc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getPublishedLesson(lessonId)
      .then(async (result) => {
        const token = await getFirebaseAuth().currentUser?.getIdToken();

        setLesson(result.lesson);
        setPdfSrc(`/api/lessons/${lessonId}/pdf?token=${encodeURIComponent(token ?? "")}`);
      })
      .catch((error) => {
        toast({
          title: "Could not load lesson",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [lessonId, toast]);

  if (loading) {
    return <Skeleton className="h-[75vh]" />;
  }

  if (!lesson) {
    return (
      <EmptyState
        title="Lesson not found"
        description="This lesson is not available."
        icon={<FileText className="h-8 w-8" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="shadow-soft">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-muted-foreground">{lesson.chapterName}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {lesson.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.description}</p>
        </CardContent>
      </Card>
      {pdfSrc ? <PdfViewer src={pdfSrc} title={lesson.title} /> : null}
    </div>
  );
}
