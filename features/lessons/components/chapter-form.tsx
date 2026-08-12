"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { chapterPayloadSchema, type ChapterFormValues } from "../schemas";

type ChapterFormProps = {
  defaultValues?: ChapterFormValues;
  submitLabel: string;
  onSubmit: (values: ChapterFormValues) => Promise<void>;
};

export function ChapterForm({ defaultValues, submitLabel, onSubmit }: ChapterFormProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterPayloadSchema),
    defaultValues: defaultValues ?? {
      name: "",
      description: "",
      order: 0,
      published: true,
    },
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Topic Name
          </label>
          <Input id="name" disabled={isSubmitting} {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
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
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>
      <label className="flex items-center gap-3 rounded-md border bg-card p-4 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 rounded border-input" {...register("published")} />
        Published
      </label>
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
