import { z } from "zod";

export const chapterPayloadSchema = z.object({
  name: z.string().trim().min(2, "Enter the topic name."),
  description: z.string().trim(),
  published: z.boolean(),
});

export const lessonPayloadSchema = z.object({
  chapterId: z.string().trim().min(1, "Choose a topic."),
  title: z.string().trim().min(2, "Enter the lesson title."),
  description: z.string().trim(),
  published: z.boolean(),
});

export type ChapterFormValues = z.infer<typeof chapterPayloadSchema>;
export type LessonFormValues = z.infer<typeof lessonPayloadSchema>;
