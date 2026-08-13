import { z } from "zod";

export const quizPayloadSchema = z.object({
  title: z.string().trim().min(2, "Enter the quiz title."),
  description: z.string().trim().optional().default(""),
  durationMinutes: z.number().int().min(1, "Quiz duration must be at least 1 minute."),
  maxScore: z.number().min(1, "Total score must be at least 1."),
  published: z.boolean().optional(),
});

export type QuizFormValues = z.infer<typeof quizPayloadSchema>;

export const quizGradePayloadSchema = z.object({
  score: z.number().min(0, "Score cannot be negative.").nullable().optional(),
  feedback: z.string().trim().optional(),
});
