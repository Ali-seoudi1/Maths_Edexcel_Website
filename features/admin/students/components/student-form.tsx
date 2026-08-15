"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  editStudentFormSchema,
  studentFormSchema,
  type EditStudentFormValues,
  type StudentFormValues,
} from "../schemas";

type CreateStudentFormProps = {
  mode: "create";
  defaultValues?: Partial<StudentFormValues>;
  submitLabel: string;
  onSubmit: (values: StudentFormValues) => Promise<void>;
};

type EditStudentFormProps = {
  mode: "edit";
  defaultValues: EditStudentFormValues;
  submitLabel: string;
  onSubmit: (values: EditStudentFormValues) => Promise<void>;
};

type StudentFormProps = CreateStudentFormProps | EditStudentFormProps;

export function StudentForm(props: StudentFormProps) {
  const form = useForm<StudentFormValues | EditStudentFormValues>({
    resolver: zodResolver(props.mode === "edit" ? editStudentFormSchema : studentFormSchema),
    defaultValues:
      props.mode === "edit"
        ? props.defaultValues
        : {
            fullName: props.defaultValues?.fullName ?? "",
            email: props.defaultValues?.email ?? "",
            yearGroup: props.defaultValues?.yearGroup ?? "Y10",
            mathTrack: props.defaultValues?.mathTrack ?? "OL",
          },
  });

  async function handleFormSubmit(values: StudentFormValues | EditStudentFormValues) {
    if (props.mode === "edit") {
      await props.onSubmit(values as EditStudentFormValues);
      return;
    }

    await props.onSubmit(values as StudentFormValues);
  }

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = form;

  return (
    <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Student full name"
            disabled={isSubmitting}
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="student@example.com"
            disabled={isSubmitting}
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="yearGroup" className="text-sm font-medium text-foreground">
            Year
          </label>
          <select
            id="yearGroup"
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("yearGroup")}
          >
            <option value="Y9">Year 9</option>
            <option value="Y10">Year 10</option>
            <option value="Y11">Year 11</option>
            <option value="Y12">Year 12</option>
            <option value="Y13">Year 13</option>
          </select>
          {errors.yearGroup ? <p className="text-sm text-destructive">{errors.yearGroup.message}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="mathTrack" className="text-sm font-medium text-foreground">
            Maths Type
          </label>
          <select
            id="mathTrack"
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("mathTrack")}
          >
            <option value="OL">O Level</option>
            <option value="AL">A Level</option>
          </select>
          {errors.mathTrack ? <p className="text-sm text-destructive">{errors.mathTrack.message}</p> : null}
        </div>
      </div>

      {props.mode === "edit" ? (
        <label className="flex items-center gap-3 rounded-md border bg-card p-4 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            disabled={isSubmitting}
            {...register("active")}
          />
          Active student account
        </label>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving
          </>
        ) : (
          props.submitLabel
        )}
      </Button>
    </form>
  );
}
