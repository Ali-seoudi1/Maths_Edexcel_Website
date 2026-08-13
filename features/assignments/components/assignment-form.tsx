"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { assignmentPayloadSchema, type AssignmentFormValues } from "../schemas";
import type { Assignment } from "../types";

type AssignmentFormProps = {
  assignment?: Assignment;
  submitLabel: string;
  requiresPdf?: boolean;
  onSubmit: (values: AssignmentFormValues, pdfFiles: File[]) => Promise<void>;
};

export function AssignmentForm({
  assignment,
  submitLabel,
  requiresPdf = false,
  onSubmit,
}: AssignmentFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentPayloadSchema),
    defaultValues: assignment
      ? {
          title: assignment.title,
          description: assignment.description,
          deadline: assignment.deadline
            ? new Date(assignment.deadline).toISOString().slice(0, 16)
            : "",
          maxGrade: assignment.maxGrade,
        }
      : {
          title: "",
          description: "",
          deadline: "",
          maxGrade: 100,
        },
  });

  async function handleFormSubmit(values: AssignmentFormValues, event?: React.BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    const fileInput = form?.elements.namedItem("pdfs") as HTMLInputElement | null;
    const pdfFiles = Array.from(fileInput?.files ?? []);

    if (requiresPdf && !values.description.trim() && pdfFiles.length === 0) {
      throw new Error("Add a description, upload at least one PDF, or both.");
    }

    await onSubmit(values, pdfFiles);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Assignment title
        </label>
        <Input id="title" disabled={isSubmitting} {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
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
        <label htmlFor="deadline" className="text-sm font-medium text-foreground">
          Deadline
        </label>
        <Input
          id="deadline"
          type="datetime-local"
          disabled={isSubmitting}
          {...register("deadline")}
        />
        {errors.deadline ? (
          <p className="text-sm text-destructive">{errors.deadline.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="maxGrade" className="text-sm font-medium text-foreground">
          Total score
        </label>
        <Input
          id="maxGrade"
          type="number"
          min={1}
          disabled={isSubmitting}
          {...register("maxGrade", { valueAsNumber: true })}
        />
        {errors.maxGrade ? (
          <p className="text-sm text-destructive">{errors.maxGrade.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="pdfs" className="text-sm font-medium text-foreground">
          Upload assignment PDFs <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="pdfs"
          name="pdfs"
          type="file"
          accept="application/pdf"
          multiple
          disabled={isSubmitting}
        />
        {assignment?.pdfs.length ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Current PDFs:</p>
            <ul className="list-inside list-disc">
              {assignment.pdfs.map((pdf) => (
                <li key={pdf.id}>{pdf.fileName}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting}>
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
