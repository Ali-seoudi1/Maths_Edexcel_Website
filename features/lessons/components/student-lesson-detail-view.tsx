"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
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
  const [authToken, setAuthToken] = useState("");
  const [selectedPdfId, setSelectedPdfId] = useState("");
  const [pdfSrc, setPdfSrc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getPublishedLesson(lessonId)
      .then(async (result) => {
        const token = await getFirebaseAuth().currentUser?.getIdToken();
        const firstPdfId = result.lesson.pdfs[0]?.id ?? "";

        setLesson(result.lesson);
        setAuthToken(token ?? "");
        setSelectedPdfId(firstPdfId);
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

  useEffect(() => {
    if (!authToken || !selectedPdfId) {
      setPdfSrc("");
      return;
    }

    const params = new URLSearchParams({
      token: authToken,
      pdfId: selectedPdfId,
    });

    setPdfSrc(`/api/lessons/${lessonId}/pdf?${params.toString()}`);
  }, [authToken, lessonId, selectedPdfId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-[70vh] rounded-2xl" />
      </div>
    );
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
      <PageHeader
        eyebrow={lesson.chapterName}
        title={lesson.title}
        description={lesson.description || "Open the available PDF resources for this lesson inside the platform."}
      />
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Lesson resources</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lesson.pdfs.length} PDF{lesson.pdfs.length === 1 ? "" : "s"} available to view.
              </p>
            </div>
            {lesson.pdfs.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {lesson.pdfs.map((pdf) => (
                  <Button
                    key={pdf.id}
                    type="button"
                    variant={selectedPdfId === pdf.id ? "default" : "outline"}
                    onClick={() => setSelectedPdfId(pdf.id)}
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {pdf.fileName}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
          {pdfSrc ? (
            <PdfViewer
              src={pdfSrc}
              title={lesson.pdfs.find((pdf) => pdf.id === selectedPdfId)?.fileName ?? lesson.title}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
