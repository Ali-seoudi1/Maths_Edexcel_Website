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
      ) : (
        <div className="rounded-md border bg-secondary/60 p-4 text-sm leading-6 text-muted-foreground">
          New accounts are created with role <span className="font-semibold text-foreground">student</span> and
          active status enabled.
        </div>
      )}

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
