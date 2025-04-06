
import { z } from "zod";

// Schema for Multi-Subject form with proper transformations
export const MultiSubjectSchema = z.object({
  numSubjects: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
  subjects: z.array(z.string()).optional(),
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => Number(val)),
});

// Properly typed form values derived from schema
export type MultiSubjectFormValues = z.infer<typeof MultiSubjectSchema>;
