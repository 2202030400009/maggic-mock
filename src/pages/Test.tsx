
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePaper } from "@/context/PaperContext";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Flag, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/lib/types";

// Status colors for question palette
const statusColors = {
  notVisited: "bg-gray-200",
  attempted: "bg-green-500 text-white",
  skipped: "bg-red-500 text-white",
  attemptedReview: "bg-purple-500 text-white",
  skippedReview: "bg-orange-500 text-white"
};

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
  
  const [loading, setLoading] = useState(true);
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
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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

  const calculateResults = () => {
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

  const handleSubmitTest = async () => {
    try {
      // Calculate results
      const results = calculateResults();
      
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
        
        const docRef = await addDoc(collection(db, "testResponses"), testResponse);
        
        // Store results in session storage for the result page
        sessionStorage.setItem('testResults', JSON.stringify({
          ...results,
          testResponseId: docRef.id,
          questions,
          userAnswers,
          questionStatus,
          timeSpent
        }));
      }
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      navigate("/result");
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error",
        description: "Failed to submit test results. Please try again.",
        variant: "destructive",
      });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attempted":
        return <CheckCircle className="h-3 w-3" />;
      case "skipped":
        return <XCircle className="h-3 w-3" />;
      case "attemptedReview":
      case "skippedReview":
        return <Flag className="h-3 w-3" />;
      default:
        return null;
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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold">{paperType} {year || "Personalized Test"}</h1>
          <div className="flex space-x-4">
            <div className="bg-indigo-100 px-3 py-1 rounded text-sm font-medium">
              Question {currentQuestion + 1}/{questions.length}
            </div>
            <div className={cn(
              "px-3 py-1 rounded text-sm font-medium",
              remainingTime < 300 ? "bg-red-100 text-red-700" : "bg-red-100"
            )}>
              Time: {formatTime(remainingTime)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestion + 1} • {currentQuestionData.marks} mark{currentQuestionData.marks > 1 ? 's' : ''}
              </span>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs",
                  markedForReview && "bg-amber-50 border-amber-300 text-amber-700"
                )}
                onClick={() => setMarkedForReview(!markedForReview)}
              >
                <Flag className={cn("h-3 w-3 mr-1", markedForReview ? "text-amber-500" : "text-gray-400")} />
                {markedForReview ? "Marked for Review" : "Mark for Review"}
              </Button>
            </div>

            <h2 className="text-lg font-medium mb-6">{currentQuestionData.text}</h2>
            
            {currentQuestionData.imageUrl && (
              <div className="mb-6">
                <img 
                  src={currentQuestionData.imageUrl} 
                  alt="Question" 
                  className="max-h-[300px] object-contain mx-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Image+Not+Available";
                  }}
                />
              </div>
            )}

            {currentQuestionData.type === "MCQ" && currentQuestionData.options && (
              <div className="space-y-3">
                {currentQuestionData.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "border rounded-md p-3 cursor-pointer transition-colors",
                      selectedOption === option.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center mr-3",
                        selectedOption === option.id 
                          ? "border-indigo-500 bg-indigo-500 text-white" 
                          : "border-gray-300"
                      )}>
                        {option.id.toUpperCase()}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentQuestionData.type === "MSQ" && currentQuestionData.options && (
              <div className="space-y-3">
                {currentQuestionData.options.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "border rounded-md p-3 cursor-pointer transition-colors",
                      selectedOptions.includes(option.id)
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleOptionSelect(option.id)}
                  >
                    <div className="flex items-center">
                      <div className={cn(
                        "w-6 h-6 rounded border flex items-center justify-center mr-3",
                        selectedOptions.includes(option.id) 
                          ? "border-indigo-500 bg-indigo-50 text-indigo-500" 
                          : "border-gray-300"
                      )}>
                        {selectedOptions.includes(option.id) && "✓"}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentQuestionData.type === "NAT" && (
              <div className="my-6">
                <Input
                  type="number"
                  placeholder="Enter your answer"
                  className="max-w-xs"
                  value={
                    typeof userAnswers[currentQuestion] === "string"
                      ? userAnswers[currentQuestion] as string
                      : ""
                  }
                  onChange={(e) => updateAnswer(e.target.value)}
                />
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
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
                }}
              >
                Skip
              </Button>
              
              <Button onClick={handleNextQuestion} className="bg-indigo-600 hover:bg-indigo-700">
                {currentQuestion === questions.length - 1 ? "Submit Test" : "Save & Next"}
                {currentQuestion !== questions.length - 1 && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-72 bg-white shadow-lg p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Question Palette</h3>
          
          <div className="mb-4 flex flex-wrap gap-1">
            {Array(questions.length).fill(0).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-8 h-8 text-xs font-medium rounded flex items-center justify-center",
                  statusColors[questionStatus[index] as keyof typeof statusColors] || statusColors.notVisited
                )}
                onClick={() => handleJumpToQuestion(index)}
              >
                {index + 1}
                {getStatusIcon(questionStatus[index])}
              </button>
            ))}
          </div>

          <div className="border-t pt-3">
            <div className="text-xs font-medium mb-1">Legend:</div>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(statusColors).map(([key, color]) => (
                <div key={key} className="flex items-center text-xs">
                  <div className={cn("w-4 h-4 rounded mr-2", color)}></div>
                  <span className="capitalize">
                    {key === "notVisited" ? "Not Visited" : 
                     key === "attemptedReview" ? "Attempted & Marked" : 
                     key === "skippedReview" ? "Skipped & Marked" : 
                     key}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
