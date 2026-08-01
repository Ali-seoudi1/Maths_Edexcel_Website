import { z } from "zod";

export const examSessionSchema = z.enum(["may-june", "oct-nov"]);

export const officialResourceTypeSchema = z.enum(["pdf", "image"]);

export const modelAnswerPayloadSchema = z.object({
  examYear: z.coerce
    .number()
    .int("Enter a valid exam year.")
    .min(2000, "Exam year must be 2000 or later.")
    .max(2100, "Exam year is too far in the future."),
  session: examSessionSchema,
  paper: z.string().trim().min(1, "Enter the paper."),
  questionNumber: z.string().trim().min(1, "Enter the question number."),
  officialMarkSchemePath: z.string().trim().min(1, "Upload the official mark scheme."),
  officialMarkSchemeFileName: z.string().trim().min(1, "Mark scheme file name is required."),
  officialMarkSchemeType: officialResourceTypeSchema,
  teacherSolutionHtml: z.string().trim().min(1, "Enter the teacher written solution."),
  published: z.boolean(),
});

export const modelAnswerSearchSchema = z.object({
  examYear: z.coerce.number().int().min(2000).max(2100),
  session: examSessionSchema,
  paper: z.string().trim().min(1),
  questionNumber: z.string().trim().min(1),
});

export type ModelAnswerFormValues = z.infer<typeof modelAnswerPayloadSchema>;
export type ModelAnswerSearchValues = z.infer<typeof modelAnswerSearchSchema>;
