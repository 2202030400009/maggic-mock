
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/lib/types";
import { generateSpecialTest } from "@/services/testService";

interface TestParams {
  questions: Question[];
  duration: number;
  testType: string;
}

export const useTestLoader = (year: string | undefined, paperType: string | null, testId?: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>({});
  const [remainingTime, setRemainingTime] = useState<number>(10800);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTest = async () => {
      try {
        let testParams: TestParams | null = null;
        const params = new URLSearchParams(window.location.search);
        
        // Get testId from params if not passed directly
        const specialTestId = testId || (window.location.pathname.includes('/test/special/') 
          ? window.location.pathname.split('/test/special/')[1]
          : null);
        
        console.log("URL pathname:", window.location.pathname);
        console.log("Extracted testId from URL:", specialTestId);
        
        const storedParams = sessionStorage.getItem('testParams');
        
        if (storedParams) {
          testParams = JSON.parse(storedParams);
          sessionStorage.removeItem('testParams');
          console.log("Using stored test parameters:", testParams);
        } 
        
        // Handle special test case
        else if (specialTestId) {
          console.log("Loading special test with ID:", specialTestId);
          const specialTestParams = await generateSpecialTest(specialTestId);
          
          if (specialTestParams && specialTestParams.questions && specialTestParams.questions.length > 0) {
            console.log("Special test loaded successfully:", specialTestParams);
            testParams = specialTestParams;
          } else {
            console.error("Failed to load special test or no questions found");
            setError("Failed to load special test. Please try again.");
            toast({
              title: "Error",
              description: "Failed to load special test or no questions found. Please try again.",
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
        }
        // Handle PYQ test case
        else if (year) {
          console.log("Loading PYQ test for year:", year, "paper type:", paperType);
          const collectionName = `pyqQuestions_${paperType?.replace(" ", "_")}_${year}`;
          
          const q = query(collection(db, collectionName));
          
          const querySnapshot = await getDocs(q);
          const fetchedQuestions: Question[] = [];
          
          querySnapshot.forEach((doc) => {
            fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
          });
          
          if (fetchedQuestions.length === 0) {
            setError("No questions found");
            toast({
              title: "No questions found",
              description: `No questions found for ${paperType} ${year}. Please try another paper.`,
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
          
          if (fetchedQuestions.length < 65) {
            toast({
              title: "Insufficient questions",
              description: `Only ${fetchedQuestions.length}/65 questions are available for ${paperType} ${year}. Please try another paper or contact admin.`,
              variant: "destructive",
            });
            navigate("/dashboard");
            return;
          }
          
          const selectedQuestions = fetchedQuestions.slice(0, 65);
          testParams = {
            questions: selectedQuestions,
            duration: 180,
            testType: "PYQ"
          };
        } else {
          setError("No test parameters found");
          toast({
            title: "Error",
            description: "No test parameters found. Returning to dashboard.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        // Process test parameters
        if (testParams && testParams.questions && testParams.questions.length > 0) {
          console.log(`Setting up test with ${testParams.questions.length} questions`);
          setQuestions(testParams.questions);
          setRemainingTime(testParams.duration * 60); // Convert minutes to seconds
          
          const answers = Array(testParams.questions.length).fill(null);
          setUserAnswers(answers);
          setTimeSpent(Array(testParams.questions.length).fill(0));
          setQuestionStatus(
            Array(testParams.questions.length)
              .fill(0)
              .reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
          );
        } else {
          console.error("Invalid test parameters:", testParams);
          setError("Invalid test parameters");
          toast({
            title: "Error",
            description: "Invalid test parameters or no questions found. Returning to dashboard.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading test:", error);
        setError("Failed to load test");
        toast({
          title: "Error",
          description: "Failed to load test data. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };
    
    loadTest();
  }, [year, paperType, toast, navigate, testId]);

  return {
    questions,
    loading,
    userAnswers,
    setUserAnswers,
    timeSpent,
    setTimeSpent,
    questionStatus,
    setQuestionStatus,
    remainingTime,
    setRemainingTime,
    error
  };
};
