import { Question, TestParams } from "@/lib/types";
import { fetchQuestions, shuffleArray } from "@/utils/test-utils";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Subject weightage for full-length test (100 marks total)
const SUBJECT_WEIGHTAGE = {
  "Programming & Data Structure": 10,
  "Algorithms": 7,
  "Operating Systems": 9,
  "DBMS": 7,
  "Computer Networks": 8,
  "COA": 10, // Computer Organization & Architecture
  "Discrete Mathematics": 11,
  "Theory of Computation": 8,
  "Compiler Design": 6,
  "Digital Logic": 5,
  "Engineering Mathematics": 4,
  "Aptitude": 15
};

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

// Generate full syllabus test with subject weightage
export const generateFullSyllabusTest = async (
  paperType: string,
  numQuestions: number = 65,
  duration: number = 180
): Promise<TestParams | null> => {
  try {
    console.log(`Generating full syllabus test for ${paperType} with ${numQuestions} questions`);
    
    // Default configuration: 30 questions of 1 mark, 35 questions of 2 marks
    const oneMarkQuotaTotal = 30;
    const twoMarkQuotaTotal = 35;
    
    // Calculate how many questions to fetch from each subject based on weightage
    const subjectDistribution: Record<string, { oneMarkQuota: number, twoMarkQuota: number }> = {};
    let remainingOneMarkQuota = oneMarkQuotaTotal;
    let remainingTwoMarkQuota = twoMarkQuotaTotal;
    
    // First pass: Calculate the distribution based on weightage
    for (const [subject, weightage] of Object.entries(SUBJECT_WEIGHTAGE)) {
      // Calculate proportional distribution of questions
      const totalMarks = weightage;
      // For subjects with odd number of marks, allocate more 1-mark questions
      let twoMarkCount = Math.floor(totalMarks / 2);
      let oneMarkCount = totalMarks - (twoMarkCount * 2);
      
      // Adjust if we don't have enough quota left
      if (twoMarkCount > remainingTwoMarkQuota) {
        const excess = twoMarkCount - remainingTwoMarkQuota;
        twoMarkCount = remainingTwoMarkQuota;
        oneMarkCount += excess * 2; // Convert 2-mark to 1-mark questions
      }
      
      if (oneMarkCount > remainingOneMarkQuota) {
        oneMarkCount = remainingOneMarkQuota;
      }
      
      subjectDistribution[subject] = {
        oneMarkQuota: oneMarkCount,
        twoMarkQuota: twoMarkCount
      };
      
      remainingOneMarkQuota -= oneMarkCount;
      remainingTwoMarkQuota -= twoMarkCount;
    }
    
    console.log("Subject distribution:", subjectDistribution);
    
    // Fetch questions for each subject based on the calculated distribution
    const allSelectedQuestions: Question[] = [];
    const allQuestionsMap: Record<string, Question[]> = {};
    
    // First, get all questions from the database for the paper type
    const questionsRef = collection(db, "questions");
    const q = query(
      questionsRef,
      where("paperType", "==", paperType)
    );
    
    const querySnapshot = await getDocs(q);
    const allQuestions: Question[] = [];
    
    querySnapshot.forEach(doc => {
      allQuestions.push({ id: doc.id, ...doc.data() } as Question);
    });
    
    console.log(`Retrieved total of ${allQuestions.length} questions for ${paperType}`);
    
    // Group questions by subject and marks
    for (const question of allQuestions) {
      const subject = question.subject;
      const marks = question.marks;
      
      if (!allQuestionsMap[subject]) {
        allQuestionsMap[subject] = [];
      }
      
      allQuestionsMap[subject].push(question);
    }
    
    // Distribute questions according to the calculated quotas
    for (const [subject, quota] of Object.entries(subjectDistribution)) {
      const subjectQuestions = allQuestionsMap[subject] || [];
      console.log(`Subject ${subject}: Found ${subjectQuestions.length} questions`);
      
      if (subjectQuestions.length === 0) {
        console.log(`No questions available for subject: ${subject}`);
        continue;
      }
      
      // Get 1-mark questions
      if (quota.oneMarkQuota > 0) {
        const oneMarkQuestions = subjectQuestions.filter(q => q.marks === 1);
        console.log(`Subject ${subject}: Found ${oneMarkQuestions.length} one-mark questions, needed ${quota.oneMarkQuota}`);
        
        // Shuffle and select
        const shuffledOneMark = shuffleArray(oneMarkQuestions);
        // Take as many as are available, up to the quota
        const selectedOneMark = shuffledOneMark.slice(0, quota.oneMarkQuota);
        allSelectedQuestions.push(...selectedOneMark);
        
        console.log(`Selected ${selectedOneMark.length} one-mark questions for ${subject}`);
      }
      
      // Get 2-mark questions
      if (quota.twoMarkQuota > 0) {
        const twoMarkQuestions = subjectQuestions.filter(q => q.marks === 2);
        console.log(`Subject ${subject}: Found ${twoMarkQuestions.length} two-mark questions, needed ${quota.twoMarkQuota}`);
        
        // Shuffle and select
        const shuffledTwoMark = shuffleArray(twoMarkQuestions);
        // Take as many as are available, up to the quota
        const selectedTwoMark = shuffledTwoMark.slice(0, quota.twoMarkQuota);
        allSelectedQuestions.push(...selectedTwoMark);
        
        console.log(`Selected ${selectedTwoMark.length} two-mark questions for ${subject}`);
      }
    }
    
    // If we couldn't get enough questions, add more from available subjects to reach target count
    if (allSelectedQuestions.length < numQuestions) {
      console.log(`Only got ${allSelectedQuestions.length} questions, trying to add more to reach ${numQuestions}`);
      
      // Find all unused questions that weren't selected
      const selectedIds = new Set(allSelectedQuestions.map(q => q.id));
      const remainingQuestions = allQuestions.filter(q => !selectedIds.has(q.id));
      
      if (remainingQuestions.length > 0) {
        // Shuffle remaining questions and add until we reach the target
        const additionalNeeded = numQuestions - allSelectedQuestions.length;
        const additionalQuestions = shuffleArray(remainingQuestions).slice(0, additionalNeeded);
        
        allSelectedQuestions.push(...additionalQuestions);
        console.log(`Added ${additionalQuestions.length} additional questions to reach ${allSelectedQuestions.length} total`);
      }
    }
    
    // If we have more questions than needed, trim to the required number
    const finalQuestionCount = Math.min(numQuestions, allSelectedQuestions.length);
    const finalQuestions = shuffleArray(allSelectedQuestions).slice(0, finalQuestionCount);
    
    // Verify the total marks and question counts
    let totalMarks = 0;
    let oneMarkCount = 0;
    let twoMarkCount = 0;
    
    finalQuestions.forEach(q => {
      totalMarks += q.marks;
      if (q.marks === 1) oneMarkCount++;
      if (q.marks === 2) twoMarkCount++;
    });
    
    console.log(`Generated test with ${finalQuestions.length} questions (${oneMarkCount} one-mark, ${twoMarkCount} two-mark) for ${totalMarks} total marks`);
    
    const testParams: TestParams = {
      questions: finalQuestions,
      duration: duration,
      testType: "Full Syllabus"
    };
    
    return testParams;
  } catch (error) {
    console.error("Error generating full syllabus test:", error);
    return null;
  }
};

// Helper function to fetch questions for a subject with specific marks
async function fetchQuestionsForSubject(
  paperType: string,
  subject: string,
  marks: number,
  count: number
): Promise<Question[]> {
  try {
    const questionsRef = collection(db, "questions");
    const q = query(
      questionsRef,
      where("paperType", "==", paperType),
      where("subject", "==", subject),
      where("marks", "==", marks)
    );
    
    const querySnapshot = await getDocs(q);
    const questions: Question[] = [];
    
    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() } as Question);
    });
    
    // Shuffle and take only what we need
    return shuffleArray(questions).slice(0, count);
  } catch (error) {
    console.error(`Error fetching ${marks}-mark questions for ${subject}:`, error);
    return [];
  }
}

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
      
      // Validate that each question has the required fields
      const validQuestions = testData.questions.filter((q: any) => 
        q && q.text && q.type && (q.type === 'MCQ' || q.type === 'MSQ' || q.type === 'NAT')
      );
      
      if (validQuestions.length === 0) {
        console.error("No valid questions found in special test data");
        return null;
      }
      
      const testParams: TestParams = {
        questions: validQuestions as Question[],
        duration: testData.duration || 60, // Default 60 minutes if not specified
        testType: "Special Test"
      };
      
      console.log("Successfully prepared special test with questions:", validQuestions.length);
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
