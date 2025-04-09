
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
      
      // Consider an answer attempted if it's not null and not empty
      const isAttempted = userAnswer !== null && 
        (typeof userAnswer !== 'string' || userAnswer.trim() !== '') &&
        (!Array.isArray(userAnswer) || userAnswer.length > 0);
        
      if (isAttempted) {
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
          // Check if user selected all the correct options and nothing else
          const allCorrectOptionsSelected = question.correctOptions.every(opt => 
            userAnswer.includes(opt)
          );
          
          const noIncorrectOptionsSelected = userAnswer.every(opt => 
            question.correctOptions?.includes(opt)
          );
          
          // User must select ALL correct options AND ONLY correct options
          if (allCorrectOptionsSelected && noIncorrectOptionsSelected) {
            rawMarks += question.marks;
            subjectPerformance[question.subject].scored += question.marks;
          } else {
            // Only apply negative marking if the user selected something
            lossMarks += Math.abs(question.negativeMark || 0);
          }
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
          } else {
            // Only apply negative marking if the user entered something
            lossMarks += Math.abs(question.negativeMark || 0);
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
    
    // Allow negative final score
    const actualMarks = rawMarks - lossMarks;
    const totalMarks = questions.reduce((total, q) => total + q.marks, 0);
    
    // Scale based on test type - use actual total marks for non-standard tests
    const scaledMarks = totalMarks === 65 ? Math.round((actualMarks / totalMarks) * 100) : actualMarks;
    
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
