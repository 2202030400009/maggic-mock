
import { z } from "zod";

// Schema for Multi-Subject form with proper transformations
export const MultiSubjectSchema = z.object({
  numSubjects: z
    .string()
    .min(1, "Required")
    .transform((val) => parseInt(val, 10)),
  subjects: z.array(z.string()).optional(),
  numQuestions: z
    .string()
    .min(1, "Required")
    .transform((val) => parseInt(val, 10)),
  duration: z
    .string()
    .min(1, "Required")
    .transform((val) => parseInt(val, 10)),
});

// Properly typed form values derived from schema
export type MultiSubjectFormValues = z.infer<typeof MultiSubjectSchema>;

// Helper function for calculating test duration based on number of questions
export const calculateTestDuration = (numQuestions: number): number => {
  // 3 minutes per question
  return numQuestions * 3;
};

// Helper function for calculating maximum allowed duration
export const calculateMaxDuration = (numQuestions: number): number => {
  // 10 minutes per question as maximum
  return numQuestions * 10;
};
