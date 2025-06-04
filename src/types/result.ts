import { Option, Question, QuestionType } from "@/lib/types";

export interface SubjectPerformance {
  subject: string;
  total: number;
  scored: number;
  attempted: number;
  totalQuestions: number;
  percentage: number;
}

export interface QuestionDetail {
  id: string;
  text: string;
  type: QuestionType;
  options?: Option[];
  correctOption?: string;
  correctOptions?: string[];
  rangeStart?: number;
  rangeEnd?: number;
  userAnswer?: string | string[] | null;
  marks: number;
  negativeMark: number;
  subject: string;
  isCorrect: boolean;
  isSkipped: boolean;
  imageUrl?: string;
}

export interface TestResult {
  rawMarks: number;
  lossMarks: number;
  actualMarks: number;
  scaledMarks: number;
  totalMarks: number;
  subjectPerformance: SubjectPerformance[];
  weakSubjects: string[];
  testResponseId?: string;
  questions?: Question[];
  userAnswers?: (string | string[] | null)[];
  questionStatus?: Record<number, string>;
}
