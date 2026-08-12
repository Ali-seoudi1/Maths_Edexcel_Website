import { z } from "zod";

export const chapterPayloadSchema = z.object({
  name: z.string().trim().min(2, "Enter the topic name."),
  description: z.string().trim().min(1, "Enter the topic description."),
  order: z.number().int("Enter a whole number.").min(0, "Order must be 0 or higher."),
  published: z.boolean(),
});

export const lessonPayloadSchema = z.object({
  chapterId: z.string().trim().min(1, "Choose a topic."),
  title: z.string().trim().min(2, "Enter the lesson title."),
  description: z.string().trim(),
  order: z.number().int("Enter a whole number.").min(0, "Order must be 0 or higher."),
  published: z.boolean(),
});

export type ChapterFormValues = z.infer<typeof chapterPayloadSchema>;
export type LessonFormValues = z.infer<typeof lessonPayloadSchema>;
