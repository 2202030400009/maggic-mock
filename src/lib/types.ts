
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
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: any;
}

export interface TestResponse {
  id: string;
  userId: string;
  testType: string;
  year?: string;
  paperType: string;
  totalMarks: number;
  scoredMarks: number;
  lossMarks: number;
  totalTime: number;
  questions: {
    questionId: string;
    timeSpent: number;
    status: string;
    userAnswer?: string | string[];
  }[];
  timestamp: any;
}

export interface AdminStats {
  totalUsers: number;
  totalFeedbacks: number;
  totalTests: number;
  averageScore: number;
}

// Adding TestParams interface to type the test parameters
export interface TestParams {
  questions: Question[];
  duration: number;
  testType: string;
}
