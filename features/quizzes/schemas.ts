import { z } from "zod";

export const quizPayloadSchema = z.object({
  title: z.string().trim().min(2, "Enter the quiz title."),
  description: z.string().trim().min(1, "Enter the quiz description."),
  durationMinutes: z.number().int().min(1, "Quiz duration must be at least 1 minute."),
});

export type QuizFormValues = z.infer<typeof quizPayloadSchema>;
