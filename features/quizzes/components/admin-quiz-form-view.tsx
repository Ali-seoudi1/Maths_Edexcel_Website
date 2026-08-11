"use client";

import { FileText, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { createAdminQuiz, openProtectedAdminQuizPdf, updateAdminQuiz } from "../services/quiz-service";
import type { Quiz } from "../types";

type AdminQuizFormViewProps = {
  quiz?: Quiz;
  onSaved?: (quiz: Quiz) => void;
};

export function AdminQuizFormView({ quiz, onSaved }: AdminQuizFormViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(quiz?.durationMinutes ?? 10);
  const [published, setPublished] = useState(quiz?.published ?? false);
  const [removedPdfIds, setRemovedPdfIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(quiz);
  const visiblePdfs = quiz?.pdfs.filter((pdf) => !removedPdfIds.includes(pdf.id)) ?? [];

  async function handleSubmit(publishedOverride = published) {
    const pdfFiles = Array.from(fileInputRef.current?.files ?? []);

    if (!title.trim()) {
      toast({
        title: "Missing quiz title",
        description: "Add a title for the quiz.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && pdfFiles.length === 0) {
      toast({
        title: "Missing quiz PDFs",
        description: "Upload at least one PDF file for the quiz.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && visiblePdfs.length === 0 && pdfFiles.length === 0) {
      toast({
        title: "Missing quiz PDFs",
        description: "A quiz must have at least one PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const values = {
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
        published: publishedOverride,
      };

      if (quiz) {
        const result = await updateAdminQuiz(quiz.id, values, pdfFiles, removedPdfIds);
        onSaved?.(result.quiz);
        setPublished(result.quiz.published);
        setRemovedPdfIds([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        toast({ title: "Quiz updated", variant: "success" });
        router.refresh();
      } else {
        const result = await createAdminQuiz(values, pdfFiles);
        toast({ title: publishedOverride ? "Quiz published" : "Quiz created", variant: "success" });
        router.push(`/admin/quizzes/${result.quiz.id}`);
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOpenQuizPdf(pdfId: string) {
    if (!quiz) return;

    try {
      await openProtectedAdminQuizPdf(quiz.id, pdfId);
    } catch (error) {
      toast({
        title: "Could not open PDF",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{isEditing ? "Edit quiz" : "Create quiz PDF"}</CardTitle>
          {quiz ? <Badge variant={quiz.status === "active" ? "secondary" : "outline"}>{quiz.status}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Duration (minutes)</label>
          <Input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value) || 1)}
          />
        </div>
        <label className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-4">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">Publish quiz</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              For a draft quiz, turning this on starts the global timer when you save.
            </span>
          </span>
        </label>
        <div className="space-y-2">
          <label className="text-sm font-medium">Quiz PDF files</label>
          {isEditing && visiblePdfs.length > 0 ? (
            <div className="space-y-2 rounded-lg border bg-secondary/20 p-3">
              {visiblePdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex flex-col gap-2 rounded-md bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate text-sm font-medium text-foreground">{pdf.fileName}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleOpenQuizPdf(pdf.id)}>
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRemovedPdfIds((current) => [...current, pdf.id])}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Add one or more PDFs, or remove existing PDFs above." : "Upload one or more PDFs students will complete during the quiz."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isEditing ? (
              "Save quiz"
            ) : published ? (
              "Create and publish"
            ) : (
              "Save draft"
            )}
          </Button>
          {isEditing && !quiz?.published ? (
            <Button type="button" variant="secondary" onClick={() => void handleSubmit(true)} disabled={submitting}>
              Publish quiz
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
