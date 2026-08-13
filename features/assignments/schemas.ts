import { z } from "zod";

export const assignmentPayloadSchema = z.object({
  title: z.string().trim().min(2, "Enter the assignment title."),
  description: z.string().trim(),
  deadline: z
    .string()
    .trim()
    .min(1, "Choose a deadline.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Deadline must be a valid date."),
  maxGrade: z.number().min(1, "Total score must be at least 1."),
});

export const assignmentGradeSchema = z.object({
  grade: z.number().min(0).nullable().optional(),
  feedback: z.string().trim().max(500).optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentPayloadSchema>;
export type AssignmentGradeFormValues = z.infer<typeof assignmentGradeSchema>;
