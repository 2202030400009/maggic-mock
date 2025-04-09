
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/lib/types";

interface TestParams {
  questions: Question[];
  duration: number;
  testType: string;
}

export const useTestLoader = (year: string | undefined, paperType: string | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>({});
  const [remainingTime, setRemainingTime] = useState<number>(10800);

  useEffect(() => {
    const loadTest = async () => {
      try {
        let testParams: TestParams | null = null;
        
        const storedParams = sessionStorage.getItem('testParams');
        
        if (storedParams) {
          testParams = JSON.parse(storedParams);
          sessionStorage.removeItem('testParams');
        }
        
        if (testParams) {
          setQuestions(testParams.questions);
          setRemainingTime(testParams.duration * 60);
          
          const answers = Array(testParams.questions.length).fill(null);
          setUserAnswers(answers);
          setTimeSpent(Array(testParams.questions.length).fill(0));
          setQuestionStatus(
            Array(testParams.questions.length)
              .fill(0)
              .reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
          );
        } else if (year) {
          const collectionName = `pyqQuestions_${paperType?.replace(" ", "_")}_${year}`;
          
          const q = query(collection(db, collectionName));
          
          const querySnapshot = await getDocs(q);
          const fetchedQuestions: Question[] = [];
          
          querySnapshot.forEach((doc) => {
            fetchedQuestions.push({ id: doc.id, ...doc.data() } as Question);
          });
          
          if (fetchedQuestions.length === 0) {
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
          setQuestions(selectedQuestions);
          
          const answers = Array(selectedQuestions.length).fill(null);
          setUserAnswers(answers);
          setTimeSpent(Array(selectedQuestions.length).fill(0));
          setQuestionStatus(
            Array(selectedQuestions.length)
              .fill(0)
              .reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
          );
          
          setRemainingTime(10800);
        } else {
          toast({
            title: "Error",
            description: "No test parameters found. Returning to dashboard.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading test:", error);
        toast({
          title: "Error",
          description: "Failed to load test data. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };
    
    loadTest();
  }, [year, paperType, toast, navigate]);

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
    setRemainingTime
  };
};
