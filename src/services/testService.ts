
import { Question, TestParams } from "@/lib/types";
import { fetchQuestions, shuffleArray } from "@/utils/test-utils";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

// Generate special test
export const generateSpecialTest = async (
  testId: string
): Promise<TestParams | null> => {
  try {
    console.log("Generating special test with ID:", testId);
    const testDocRef = doc(db, "specialTests", testId);
    const testSnapshot = await getDoc(testDocRef);
    
    if (!testSnapshot.exists()) {
      console.error("Special test not found with ID:", testId);
      return null;
    }
    
    const testData = testSnapshot.data();
    console.log("Test data retrieved:", testData);
    
    // Check if the test has questions directly embedded
    if (testData.questions && Array.isArray(testData.questions) && testData.questions.length > 0) {
      console.log(`Using ${testData.questions.length} embedded questions for special test`);
      
      const testParams: TestParams = {
        questions: testData.questions as Question[],
        duration: testData.duration || 60, // Default 60 minutes if not specified
        testType: "Special Test"
      };
      
      return testParams;
    }
    
    // If no embedded questions, try to fetch from subcollection
    console.log("No embedded questions found, checking questions subcollection");
    const questionsCollectionRef = collection(db, `specialTests/${testId}/questions`);
    const questionsSnapshot = await getDocs(questionsCollectionRef);
    
    if (questionsSnapshot.empty) {
      console.error("No questions found in special test with ID:", testId);
      return null;
    }
    
    const questions: Question[] = [];
    questionsSnapshot.forEach(doc => {
      const questionData = doc.data();
      questions.push({ 
        id: doc.id, 
        ...questionData 
      } as Question);
    });
    
    console.log(`Successfully loaded ${questions.length} questions for special test`);
    
    const testParams: TestParams = {
      questions: questions,
      duration: testData.duration || 60, // Default 60 minutes if not specified
      testType: "Special Test"
    };
    
    return testParams;
  } catch (error) {
    console.error("Error generating special test:", error);
    return null;
  }
};
