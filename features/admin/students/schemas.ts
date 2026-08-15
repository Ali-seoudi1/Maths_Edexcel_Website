import { z } from "zod";

export const studentFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the student's full name."),
  email: z.string().trim().email("Enter a valid email address."),
  yearGroup: z.enum(["Y9", "Y10", "Y11", "Y12", "Y13"]),
  mathTrack: z.enum(["OL", "AL"]),
});

export const editStudentFormSchema = studentFormSchema.extend({
  active: z.boolean(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
export type EditStudentFormValues = z.infer<typeof editStudentFormSchema>;
