
import { z } from "zod";

// Schema for Multi-Subject form with proper transformations
export const MultiSubjectSchema = z.object({
  numSubjects: z.string().min(1, "Required"),
  subjects: z.array(z.string()).optional(),
  numQuestions: z.string().min(1, "Required"),
  duration: z.string().min(1, "Duration must be at least 1 minute"),
});

// Raw form values before transformation
export type MultiSubjectFormRawValues = z.infer<typeof MultiSubjectSchema>;

// Properly typed form values after transformation
export type MultiSubjectFormValues = {
  numSubjects: number;
  subjects?: string[];
  numQuestions: number;
  duration: number;
};

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

// Helper to transform form values after validation
export const transformFormValues = (values: MultiSubjectFormRawValues): MultiSubjectFormValues => {
  return {
    numSubjects: parseInt(values.numSubjects, 10),
    subjects: values.subjects,
    numQuestions: parseInt(values.numQuestions, 10),
    duration: parseInt(values.duration, 10),
  };
};
