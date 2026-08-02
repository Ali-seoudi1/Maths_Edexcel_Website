"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

import { createAdminChapter, updateAdminChapter } from "../services/lesson-service";
import type { ChapterFormValues } from "../schemas";
import type { Chapter } from "../types";
import { ChapterForm } from "./chapter-form";

type AdminChapterFormViewProps = {
  chapter?: Chapter;
};

export function AdminChapterFormView({ chapter }: AdminChapterFormViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(values: ChapterFormValues) {
    try {
      if (chapter) {
        await updateAdminChapter(chapter.id, values);
      } else {
        await createAdminChapter(values);
      }

      toast({ title: chapter ? "Chapter updated" : "Chapter created", variant: "success" });
      router.push("/admin/chapters");
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle>Chapter details</CardTitle>
      </CardHeader>
      <CardContent>
        <ChapterForm
          defaultValues={
            chapter
              ? {
                  name: chapter.name,
                  description: chapter.description,
                  order: chapter.order,
                  published: chapter.published,
                }
              : undefined
          }
          submitLabel={chapter ? "Save chapter" : "Create chapter"}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
