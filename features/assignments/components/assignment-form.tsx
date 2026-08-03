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
  onSubmit: (values: AssignmentFormValues, pdfFile?: File) => Promise<void>;
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
        }
      : {
          title: "",
          description: "",
          deadline: "",
        },
  });

  async function handleFormSubmit(values: AssignmentFormValues, event?: React.BaseSyntheticEvent) {
    const form = event?.target as HTMLFormElement | undefined;
    const fileInput = form?.elements.namedItem("pdf") as HTMLInputElement | null;
    const pdfFile = fileInput?.files?.[0];

    if (requiresPdf && !pdfFile) {
      throw new Error("Upload an assignment PDF.");
    }

    await onSubmit(values, pdfFile);
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
        <label htmlFor="pdf" className="text-sm font-medium text-foreground">
          Upload assignment PDF
        </label>
        <Input id="pdf" name="pdf" type="file" accept="application/pdf" disabled={isSubmitting} />
        {assignment?.pdfFileName ? (
          <p className="text-xs text-muted-foreground">Current PDF: {assignment.pdfFileName}</p>
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
