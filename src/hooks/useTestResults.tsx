
import { Question } from "@/lib/types";

interface SubjectPerformance {
  subject: string;
  total: number;
  scored: number;
  attempted: number;
  totalQuestions: number;
  percentage: number;
}

interface TestResults {
  rawMarks: number;
  lossMarks: number;
  actualMarks: number;
  scaledMarks: number;
  totalMarks: number;
  subjectPerformance: SubjectPerformance[];
  weakSubjects: string[];
}

export const useTestResults = () => {
  const calculateResults = (
    questions: Question[],
    userAnswers: (string | string[] | null)[]
  ): TestResults => {
    let rawMarks = 0;
    let lossMarks = 0;
    
    // Track marks by subject
    const subjectPerformance: Record<string, {
      total: number,
      scored: number,
      attempted: number,
      totalQuestions: number
    }> = {};
    
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      
      // Initialize subject tracking
      if (!subjectPerformance[question.subject]) {
        subjectPerformance[question.subject] = {
          total: 0,
          scored: 0,
          attempted: 0,
          totalQuestions: 0
        };
      }
      
      // Count total marks and questions by subject
      subjectPerformance[question.subject].total += question.marks;
      subjectPerformance[question.subject].totalQuestions += 1;
      
      if (userAnswer) {
        subjectPerformance[question.subject].attempted += 1;
        
        // For MCQ
        if (question.type === "MCQ" && typeof userAnswer === "string") {
          if (userAnswer === question.correctOption) {
            rawMarks += question.marks;
            subjectPerformance[question.subject].scored += question.marks;
          } else {
            lossMarks += Math.abs(question.negativeMark || 0);
          }
        }
        // For MSQ
        else if (question.type === "MSQ" && Array.isArray(userAnswer) && question.correctOptions) {
          const correctCount = userAnswer.filter(opt => 
            question.correctOptions?.includes(opt)
          ).length;
          
          const incorrectCount = userAnswer.filter(opt => 
            !question.correctOptions?.includes(opt)
          ).length;
          
          // All correct options and no incorrect ones
          if (correctCount === question.correctOptions.length && incorrectCount === 0) {
            rawMarks += question.marks;
            subjectPerformance[question.subject].scored += question.marks;
          }
          // Partial marking could be added here if needed
        }
        // For NAT
        else if (question.type === "NAT" && typeof userAnswer === "string" && 
                question.rangeStart !== undefined && question.rangeEnd !== undefined) {
          const numAnswer = parseFloat(userAnswer);
          if (!isNaN(numAnswer) && 
              numAnswer >= question.rangeStart && 
              numAnswer <= question.rangeEnd) {
            rawMarks += question.marks;
            subjectPerformance[question.subject].scored += question.marks;
          }
        }
      }
    });
    
    // Format subject performance for UI
    const formattedSubjectPerformance = Object.entries(subjectPerformance).map(
      ([subject, data]) => ({
        subject,
        total: data.total,
        scored: data.scored,
        attempted: data.attempted,
        totalQuestions: data.totalQuestions,
        percentage: data.total > 0 ? Math.round((data.scored / data.total) * 100) : 0
      })
    );
    
    // Find weak subjects (less than 50% score)
    const weakSubjects = formattedSubjectPerformance
      .filter(subject => subject.percentage < 50)
      .map(subject => subject.subject);
    
    const actualMarks = Math.max(0, rawMarks - lossMarks);
    const totalMarks = questions.reduce((total, q) => total + q.marks, 0);
    
    // Scale to 100 marks if total is more than 100
    const scaledMarks = totalMarks > 100 ? Math.round((actualMarks / totalMarks) * 100) : actualMarks;
    
    return {
      rawMarks,
      lossMarks,
      actualMarks,
      scaledMarks,
      totalMarks,
      subjectPerformance: formattedSubjectPerformance,
      weakSubjects
    };
  };

  return { calculateResults };
};
