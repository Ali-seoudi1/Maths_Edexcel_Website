import { z } from "zod";

export const examPayloadSchema = z.object({
  title: z.string().trim().min(2, "Enter the exam title."),
  description: z.string().trim().optional().default(""),
  durationMinutes: z.number().int().min(1, "Exam duration must be at least 1 minute."),
  maxScore: z.number().min(1, "Total score must be at least 1."),
  published: z.boolean().optional(),
  scheduledAt: z.string().trim().nullable().optional(),
});

export type ExamFormValues = z.infer<typeof examPayloadSchema>;

export const examGradePayloadSchema = z.object({
  score: z.number().min(0, "Score cannot be negative.").nullable().optional(),
  feedback: z.string().trim().optional(),
  returnFeedback: z.boolean().optional(),
});
