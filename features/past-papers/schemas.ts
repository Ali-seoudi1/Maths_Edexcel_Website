import { z } from "zod";

export const pastPapersSettingsSchema = z.object({
  pastPapersDriveUrl: z
    .string()
    .trim()
    .url("Enter a valid Google Drive folder URL.")
    .refine(
      (value) => value.startsWith("https://drive.google.com/"),
      "Enter a Google Drive URL.",
    ),
});

export type PastPapersSettingsFormValues = z.infer<typeof pastPapersSettingsSchema>;
