
import { Question, TestParams } from "@/lib/types";
import { fetchQuestions, shuffleArray } from "@/utils/test-utils";

// Process questions and prepare them for test
export const processQuestions = async (
  questions: Question[],
  numQuestions: number,
  duration: number,
  selectedTestType: string
): Promise<TestParams | null> => {
  if (questions.length === 0) {
    return null;
  }
  
  const shuffledQuestions = shuffleArray(questions);
  const selectedQuestions = shuffledQuestions.slice(0, numQuestions);
  
  const testParams: TestParams = {
    questions: selectedQuestions,
    duration: duration,
    testType: selectedTestType
  };
  
  return testParams;
};

// Generate full syllabus test
export const generateFullSyllabusTest = async (
  paperType: string,
  numQuestions: number,
  duration: number
): Promise<TestParams | null> => {
  const questions = await fetchQuestions("Full Syllabus", paperType, {});
  return processQuestions(questions, numQuestions, duration, "Full Syllabus");
};

// Generate subject wise test
export const generateSubjectWiseTest = async (
  paperType: string,
  subject: string,
  numQuestions: number,
  duration: number
): Promise<TestParams | null> => {
  const questions = await fetchQuestions("Subject Wise", paperType, { 
    subject: subject 
  });
  return processQuestions(questions, numQuestions, duration, "Subject Wise");
};

// Generate multi-subject test
export const generateMultiSubjectTest = async (
  paperType: string,
  subjects: string[],
  numQuestions: number,
  duration: number
): Promise<TestParams | null> => {
  const questions = await fetchQuestions("Multi-Subject Test", paperType, {
    subjects: subjects
  });
  return processQuestions(questions, numQuestions, duration, "Multi-Subject Test");
};
