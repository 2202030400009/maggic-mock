
export type QuestionType = "MCQ" | "MSQ" | "NAT";

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: Option[];
  correctOption?: string; // For MCQ
  correctOptions?: string[]; // For MSQ
  rangeStart?: number; // For NAT
  rangeEnd?: number; // For NAT
  imageUrl?: string;
  marks: number;
  negativeMark: number;
  subject: string;
  paperType?: string;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  userId?: string;
  timestamp: any;
}

export interface TestResponse {
  id: string;
  userId: string;
  userEmail: string;
  testType: string;
  year?: string;
  paperType: string;
  totalMarks: number;
  scoredMarks: number;
  scaledMarks: number;
  lossMarks: number;
  totalTime: number;
  questions: {
    questionId: string;
    questionText: string;
    questionType: string;
    options?: Option[];
    correctOption?: string;
    correctOptions?: string[];
    userAnswer?: string | string[];
    timeSpent: number;
    status: string;
    marks: number;
    subject: string;
  }[];
  subjectPerformance: {
    subject: string;
    total: number;
    scored: number;
    attempted: number;
    totalQuestions: number;
    percentage: number;
  }[];
  weakSubjects: string[];
  timestamp: any;
}

export interface AdminStats {
  totalUsers: number;
  totalFeedbacks: number;
  totalTests: number;
  averageScore: number;
}

// Updated TestParams interface with proper types
export interface TestParams {
  questions: Question[];
  duration: number;  // Number type for duration
  testType: string;  // String type for test type
}
