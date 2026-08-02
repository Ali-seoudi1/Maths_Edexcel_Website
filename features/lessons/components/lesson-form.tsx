"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { lessonPayloadSchema, type LessonFormValues } from "../schemas";
import type { Chapter, Lesson } from "../types";

type LessonFormProps = {
  chapters: Chapter[];
  lesson?: Lesson;
  submitLabel: string;
  requiresPdf?: boolean;
  onSubmit: (values: LessonFormValues, pdfFile?: File) => Promise<void>;
};

export function LessonForm({
  chapters,
  lesson,
  submitLabel,
  requiresPdf = false,
  onSubmit,
}: LessonFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonPayloadSchema),
    defaultValues: lesson
      ? {
          chapterId: lesson.chapterId,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          published: lesson.published,
        }
      : {
          chapterId: chapters[0]?.id ?? "",
          title: "",
          description: "",
          order: 0,
          published: true,
        },
  });

  async function handleFormSubmit(values: LessonFormValues, event?: React.BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    const fileInput = form?.elements.namedItem("pdf") as HTMLInputElement | null;
    const pdfFile = fileInput?.files?.[0];

    if (requiresPdf && !pdfFile) {
      throw new Error("Upload a lesson PDF.");
    }

    await onSubmit(values, pdfFile);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-2">
        <label htmlFor="chapterId" className="text-sm font-medium text-foreground">
          Chapter
        </label>
        <select
          id="chapterId"
          disabled={isSubmitting}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register("chapterId")}
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
        {errors.chapterId ? (
          <p className="text-sm text-destructive">{errors.chapterId.message}</p>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Lesson Title
          </label>
          <Input id="title" disabled={isSubmitting} {...register("title")} />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="order" className="text-sm font-medium text-foreground">
            Display Order
          </label>
          <Input
            id="order"
            type="number"
            min={0}
            disabled={isSubmitting}
            {...register("order", { valueAsNumber: true })}
          />
          {errors.order ? (
            <p className="text-sm text-destructive">{errors.order.message}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          disabled={isSubmitting}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label htmlFor="pdf" className="text-sm font-medium text-foreground">
          Upload PDF
        </label>
        <Input id="pdf" name="pdf" type="file" accept="application/pdf" disabled={isSubmitting} />
        {lesson?.pdfFileName ? (
          <p className="text-xs text-muted-foreground">Current PDF: {lesson.pdfFileName}</p>
        ) : null}
      </div>
      <label className="flex items-center gap-3 rounded-md border bg-card p-4 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 rounded border-input" {...register("published")} />
        Published
      </label>
      <Button type="submit" disabled={isSubmitting || chapters.length === 0}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
