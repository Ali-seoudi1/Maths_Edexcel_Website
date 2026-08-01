"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { examSessionLabels } from "../constants";
import { modelAnswerPayloadSchema, type ModelAnswerFormValues } from "../schemas";
import { uploadOfficialMarkScheme } from "../services/model-answer-service";
import type { ModelAnswer, ModelAnswerPayload } from "../types";
import { RichTextEditor } from "./rich-text-editor";

type ModelAnswerFormProps = {
  defaultValue?: ModelAnswer;
  submitLabel: string;
  onSubmit: (values: ModelAnswerPayload) => Promise<void>;
};

export function ModelAnswerForm({ defaultValue, submitLabel, onSubmit }: ModelAnswerFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teacherSolutionHtml, setTeacherSolutionHtml] = useState(
    defaultValue?.teacherSolutionHtml ?? "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<ModelAnswerFormValues>({
    defaultValues: {
      examYear: defaultValue?.examYear ?? new Date().getFullYear(),
      session: defaultValue?.session ?? "may-june",
      paper: defaultValue?.paper ?? "",
      questionNumber: defaultValue?.questionNumber ?? "",
      officialMarkSchemePath: defaultValue?.officialMarkSchemePath ?? "",
      officialMarkSchemeFileName: defaultValue?.officialMarkSchemeFileName ?? "",
      officialMarkSchemeType: defaultValue?.officialMarkSchemeType ?? "pdf",
      teacherSolutionHtml: defaultValue?.teacherSolutionHtml ?? "",
      published: true,
    },
  });

  async function handleFileUpload() {
    if (!selectedFile) {
      return null;
    }

    if (selectedFile.type !== "application/pdf" && !selectedFile.type.startsWith("image/")) {
      throw new Error("Upload a PDF or image file.");
    }

    const upload = await uploadOfficialMarkScheme(selectedFile);
    setValue("officialMarkSchemePath", upload.path, { shouldValidate: true });
    setValue("officialMarkSchemeFileName", upload.fileName, { shouldValidate: true });
    setValue("officialMarkSchemeType", upload.type, { shouldValidate: true });

    return upload;
  }

  async function handleFormSubmit(values: ModelAnswerFormValues) {
    setFormError(null);

    try {
      const upload = await handleFileUpload();
      const nextValues = {
        ...values,
        officialMarkSchemePath: upload?.path ?? watch("officialMarkSchemePath"),
        officialMarkSchemeFileName: upload?.fileName ?? watch("officialMarkSchemeFileName"),
        officialMarkSchemeType: upload?.type ?? watch("officialMarkSchemeType"),
        teacherSolutionHtml,
        published: true,
      };
      const parsedValues = modelAnswerPayloadSchema.parse(nextValues);
      await onSubmit(parsedValues);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Model answer could not be saved.");
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label htmlFor="examYear" className="text-sm font-medium text-foreground">
            Exam Year
          </label>
          <Input id="examYear" type="number" disabled={isSubmitting} {...register("examYear")} />
          {errors.examYear ? (
            <p className="text-sm text-destructive">{errors.examYear.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="session" className="text-sm font-medium text-foreground">
            Session
          </label>
          <select
            id="session"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isSubmitting}
            {...register("session")}
          >
            {Object.entries(examSessionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.session ? (
            <p className="text-sm text-destructive">{errors.session.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="paper" className="text-sm font-medium text-foreground">
            Paper
          </label>
          <Input id="paper" placeholder="1H" disabled={isSubmitting} {...register("paper")} />
          {errors.paper ? <p className="text-sm text-destructive">{errors.paper.message}</p> : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="questionNumber" className="text-sm font-medium text-foreground">
            Question Number
          </label>
          <Input
            id="questionNumber"
            placeholder="9"
            disabled={isSubmitting}
            {...register("questionNumber")}
          />
          {errors.questionNumber ? (
            <p className="text-sm text-destructive">{errors.questionNumber.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="officialMarkScheme" className="text-sm font-medium text-foreground">
            Official Mark Scheme
          </label>
          <Input
            id="officialMarkScheme"
            type="file"
            accept="application/pdf,image/*"
            disabled={isSubmitting}
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <input type="hidden" {...register("officialMarkSchemePath")} />
          <input type="hidden" {...register("officialMarkSchemeFileName")} />
          <input type="hidden" {...register("officialMarkSchemeType")} />
          <p className="text-sm text-muted-foreground">
            {selectedFile?.name ??
              defaultValue?.officialMarkSchemeFileName ??
              "Upload a PDF or image."}
          </p>
          {errors.officialMarkSchemePath ? (
            <p className="text-sm text-destructive">{errors.officialMarkSchemePath.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="teacherSolutionHtml" className="text-sm font-medium text-foreground">
          Teacher Written Solution
        </label>
        <RichTextEditor
          id="teacherSolutionHtml"
          value={teacherSolutionHtml}
          disabled={isSubmitting}
          onChange={(value) => {
            setTeacherSolutionHtml(value);
            setValue("teacherSolutionHtml", value, { shouldValidate: true });
          }}
        />
        <input type="hidden" {...register("teacherSolutionHtml")} />
        {errors.teacherSolutionHtml ? (
          <p className="text-sm text-destructive">{errors.teacherSolutionHtml.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

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
