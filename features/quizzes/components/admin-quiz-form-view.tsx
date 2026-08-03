"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import { createAdminQuiz } from "../services/quiz-service";

export function AdminQuizFormView() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const pdfFile = fileInputRef.current?.files?.[0];

    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing quiz details",
        description: "Add a title and description for the quiz.",
        variant: "destructive",
      });
      return;
    }

    if (!pdfFile) {
      toast({
        title: "Missing quiz PDF",
        description: "Upload a PDF file for the quiz.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createAdminQuiz(
        {
          title: title.trim(),
          description: description.trim(),
          durationMinutes,
        },
        pdfFile,
      );

      toast({ title: "Quiz created", variant: "success" });
      router.push("/admin/quizzes");
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

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle>Create quiz PDF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
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
        <div className="space-y-2">
          <label className="text-sm font-medium">Quiz PDF</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground">
            Upload a PDF that students will open and complete during the quiz timer.
          </p>
        </div>
        <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Creating..." : "Create quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
