
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/lib/types";
import QuestionHeader from "@/components/test/QuestionHeader";
import QuestionPalette from "@/components/test/QuestionPalette";
import QuestionDisplay from "@/components/test/QuestionDisplay";
import QuestionControls from "@/components/test/QuestionControls";
import { useTestResults } from "@/hooks/useTestResults";

interface TestParams {
  questions: Question[];
  duration: number;
  testType: string;
}

const Test = () => {
  const { year } = useParams<{ year: string }>();
  const { paperType } = usePaper();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateResults } = useTestResults();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [markedForReview, setMarkedForReview] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  
  // Timer
  const [remainingTime, setRemainingTime] = useState<number>(10800); // Default 3 hours (180 minutes)
  
  // Fetch test data or use session storage data
  useEffect(() => {
    const loadTest = async () => {
      try {
        let testParams: TestParams | null = null;
        
        // Check if we have test params in session storage
        const storedParams = sessionStorage.getItem('testParams');
        
        if (storedParams) {
          testParams = JSON.parse(storedParams);
          sessionStorage.removeItem('testParams'); // Clear after using
        }
        
        if (testParams) {
          // Use the stored test parameters
          setQuestions(testParams.questions);
          setRemainingTime(testParams.duration * 60); // Convert minutes to seconds
          
          // Initialize answers and tracking arrays
          const answers = Array(testParams.questions.length).fill(null);
          setUserAnswers(answers);
          setTimeSpent(Array(testParams.questions.length).fill(0));
          setQuestionStatus(
            Array(testParams.questions.length)
              .fill(0)
              .reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
          );
        } else if (year) {
          // Fetch PYQ test data
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
          
          // Take exactly 65 questions for PYQ
          const selectedQuestions = fetchedQuestions.slice(0, 65);
          setQuestions(selectedQuestions);
          
          // Initialize answers and tracking arrays
          const answers = Array(selectedQuestions.length).fill(null);
          setUserAnswers(answers);
          setTimeSpent(Array(selectedQuestions.length).fill(0));
          setQuestionStatus(
            Array(selectedQuestions.length)
              .fill(0)
              .reduce((acc, _, index) => ({ ...acc, [index]: "notVisited" }), {})
          );
          
          // Set 3-hour time limit for PYQ tests (180 minutes)
          setRemainingTime(10800); // 3 hours in seconds
        } else {
          // No test parameters or year provided
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
  
  // Set up countdown timer
  useEffect(() => {
    if (loading) return;
    
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Track time spent on each question
  useEffect(() => {
    if (loading) return;
    
    let questionTimer: NodeJS.Timeout;
    
    const startTimer = () => {
      questionTimer = setInterval(() => {
        setTimeSpent(prev => {
          const updated = [...prev];
          updated[currentQuestion] = (updated[currentQuestion] || 0) + 1;
          return updated;
        });
      }, 1000);
    };
    
    startTimer();
    
    return () => {
      if (questionTimer) clearInterval(questionTimer);
    };
  }, [currentQuestion, loading]);
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const confirmExit = window.confirm("Are you sure you want to exit the test?");
        if (confirmExit) {
          navigate("/dashboard");
        } else {
          try {
            document.documentElement.requestFullscreen();
          } catch (error) {
            console.error("Fullscreen request failed:", error);
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [navigate]);

  const updateQuestionStatus = (status: string) => {
    setQuestionStatus(prev => ({
      ...prev,
      [currentQuestion]: status
    }));
  };
  
  const updateAnswer = (answer: string | string[] | null) => {
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentQuestion] = answer;
      return updated;
    });
    
    // For NAT questions, update status as attempted when an answer is provided
    const currentQuestionData = questions[currentQuestion];
    if (currentQuestionData.type === "NAT" && answer && answer.toString().trim() !== '') {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    }
  };

  const handleNextQuestion = () => {
    // Update status based on actions
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData.type === "MCQ" && selectedOption) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer(selectedOption);
    } else if (currentQuestionData.type === "MSQ" && selectedOptions.length > 0) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer([...selectedOptions]);
    } else if (currentQuestionData.type === "NAT") {
      const answer = userAnswers[currentQuestion];
      if (answer && answer.toString().trim() !== '') {
        updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      } else {
        updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
      }
    } else {
      updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    }

    // Move to next question or submit if last
    if (currentQuestion === questions.length - 1) {
      handleSubmitTest();
    } else {
      setCurrentQuestion(prev => prev + 1);
      
      // Reset selections based on question type for the next question
      const nextQuestion = questions[currentQuestion + 1];
      if (nextQuestion.type === "MCQ") {
        const nextAnswer = userAnswers[currentQuestion + 1];
        setSelectedOption(typeof nextAnswer === "string" ? nextAnswer : null);
        setSelectedOptions([]);
      } else if (nextQuestion.type === "MSQ") {
        setSelectedOption(null);
        const nextAnswer = userAnswers[currentQuestion + 1];
        setSelectedOptions(Array.isArray(nextAnswer) ? nextAnswer : []);
      } else {
        setSelectedOption(null);
        setSelectedOptions([]);
      }
      
      setMarkedForReview(false);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData.type === "MCQ" && selectedOption) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer(selectedOption);
    } else if (currentQuestionData.type === "MSQ" && selectedOptions.length > 0) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer([...selectedOptions]);
    } else if (currentQuestionData.type === "NAT") {
      const answer = userAnswers[currentQuestion];
      if (answer && answer.toString().trim() !== '') {
        updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      } else if (questionStatus[currentQuestion] !== "notVisited") {
        updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
      }
    } else if (questionStatus[currentQuestion] !== "notVisited") {
      updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    }

    setCurrentQuestion(index);
    
    // Reset selections based on question type
    const nextQuestion = questions[index];
    if (nextQuestion.type === "MCQ") {
      const nextAnswer = userAnswers[index];
      setSelectedOption(typeof nextAnswer === "string" ? nextAnswer : null);
      setSelectedOptions([]);
    } else if (nextQuestion.type === "MSQ") {
      setSelectedOption(null);
      const nextAnswer = userAnswers[index];
      setSelectedOptions(Array.isArray(nextAnswer) ? nextAnswer : []);
    } else {
      setSelectedOption(null);
      setSelectedOptions([]);
    }
    
    setMarkedForReview(false);
  };

  const handleSubmitTest = async () => {
    try {
      if (submitting) return; // Prevent multiple submissions
      setSubmitting(true);
      
      // Calculate results
      const results = calculateResults(questions, userAnswers);
      
      // Store test results in Firestore
      if (currentUser) {
        const testResponse = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          testType: year ? "PYQ" : "Personalized",
          year: year || null,
          paperType,
          totalMarks: results.totalMarks,
          scoredMarks: results.actualMarks,
          scaledMarks: results.scaledMarks,
          lossMarks: results.lossMarks,
          totalTime: timeSpent.reduce((a, b) => a + b, 0),
          questions: questions.map((q, index) => ({
            questionId: q.id,
            questionText: q.text,
            questionType: q.type,
            options: q.options,
            correctOption: q.correctOption,
            correctOptions: q.correctOptions,
            userAnswer: userAnswers[index],
            timeSpent: timeSpent[index],
            status: questionStatus[index] || "notVisited",
            marks: q.marks,
            subject: q.subject,
          })),
          subjectPerformance: results.subjectPerformance,
          weakSubjects: results.weakSubjects,
          timestamp: serverTimestamp(),
        };
        
        try {
          const docRef = await addDoc(collection(db, "testResponses"), testResponse);
          console.log("Test submission successful with ID:", docRef.id);
          
          // Store results in session storage for the result page
          sessionStorage.setItem('testResults', JSON.stringify({
            ...results,
            testResponseId: docRef.id,
            questions,
            userAnswers,
            questionStatus,
            timeSpent,
            paperType
          }));
          
          // Exit fullscreen
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          
          navigate("/result");
        } catch (error) {
          console.error("Error submitting test to Firestore:", error);
          throw error;
        }
      } else {
        throw new Error("No authenticated user found");
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error",
        description: "Failed to submit test results. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData.type === "MCQ") {
      setSelectedOption(optionId);
    } else if (currentQuestionData.type === "MSQ") {
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    }
  };

  const handleSkipQuestion = () => {
    updateQuestionStatus("skipped");
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      
      // Reset selections based on question type
      const nextQuestion = questions[currentQuestion + 1];
      if (nextQuestion.type === "MCQ") {
        const nextAnswer = userAnswers[currentQuestion + 1];
        setSelectedOption(typeof nextAnswer === "string" ? nextAnswer : null);
        setSelectedOptions([]);
      } else if (nextQuestion.type === "MSQ") {
        setSelectedOption(null);
        const nextAnswer = userAnswers[currentQuestion + 1];
        setSelectedOptions(Array.isArray(nextAnswer) ? nextAnswer : []);
      } else {
        setSelectedOption(null);
        setSelectedOptions([]);
      }
      
      setMarkedForReview(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading test...</p>
      </div>
    );
  }
  
  const currentQuestionData = questions[currentQuestion];
  
  if (!currentQuestionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Question data not available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <QuestionHeader 
        paperType={paperType}
        year={year}
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        remainingTime={remainingTime}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 overflow-auto">
          <QuestionDisplay
            currentQuestionData={currentQuestionData}
            currentQuestion={currentQuestion}
            markedForReview={markedForReview}
            setMarkedForReview={setMarkedForReview}
            selectedOption={selectedOption}
            selectedOptions={selectedOptions}
            handleOptionSelect={handleOptionSelect}
            updateAnswer={updateAnswer}
            userAnswers={userAnswers}
          />
          
          <QuestionControls 
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
            handleNextQuestion={handleNextQuestion}
            handleSkipQuestion={handleSkipQuestion}
            submitting={submitting}
          />
        </div>

        {/* Question Palette */}
        <QuestionPalette 
          questionsCount={questions.length}
          questionStatus={questionStatus}
          currentQuestion={currentQuestion}
          onJumpToQuestion={handleJumpToQuestion}
        />
      </div>
    </div>
  );
};

export default Test;
