
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Question } from "@/lib/types";
import { useTestResults } from "@/hooks/useTestResults";

interface UseTestControlsProps {
  questions: Question[];
  paperType: string | null;
  year?: string;
  userAnswers: (string | string[] | null)[];
  setUserAnswers: React.Dispatch<React.SetStateAction<(string | string[] | null)[]>>;
  questionStatus: Record<number, string>;
  setQuestionStatus: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

export const useTestControls = ({ 
  questions, 
  paperType, 
  year,
  userAnswers,
  setUserAnswers,
  questionStatus,
  setQuestionStatus
}: UseTestControlsProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculateResults } = useTestResults();
  
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [markedForReview, setMarkedForReview] = useState(false);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);

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
    
    const currentQuestionData = questions[currentQuestion];
    if (currentQuestionData?.type === "NAT" && answer && answer.toString().trim() !== '') {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    }
  };

  const saveCurrentQuestionAnswer = () => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData?.type === "MCQ" && selectedOption) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer(selectedOption);
    } else if (currentQuestionData?.type === "MSQ" && selectedOptions.length > 0) {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      updateAnswer([...selectedOptions]);
    } else if (currentQuestionData?.type === "NAT") {
      const answer = userAnswers[currentQuestion];
      if (answer && answer.toString().trim() !== '') {
        updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      } else {
        updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
      }
    } else {
      updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    }

    // Make sure state updates are visible in UI
    console.log("Question status updated:", currentQuestion, questionStatus[currentQuestion]);
  };

  const handleNextQuestion = () => {
    saveCurrentQuestionAnswer();
    
    if (currentQuestion === questions.length - 1) {
      handleSubmitTest();
    } else {
      moveToQuestion(currentQuestion + 1);
    }
  };

  const moveToQuestion = (index: number) => {
    setCurrentQuestion(index);
    
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
    
    setMarkedForReview(
      questionStatus[index] === "attemptedReview" || 
      questionStatus[index] === "skippedReview"
    );
  };

  const handleJumpToQuestion = (index: number) => {
    saveCurrentQuestionAnswer();
    moveToQuestion(index);
  };

  const handleSubmitTest = async () => {
    try {
      if (submitting) return;
      setSubmitting(true);
      
      // Save the last question answer before submitting
      saveCurrentQuestionAnswer();
      
      // Force a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the latest user answers
      const finalUserAnswers = [...userAnswers];
      
      // For the last question, ensure it's properly updated
      const currentQuestionData = questions[currentQuestion];
      
      if (currentQuestionData?.type === "MCQ" && selectedOption) {
        finalUserAnswers[currentQuestion] = selectedOption;
      } else if (currentQuestionData?.type === "MSQ" && selectedOptions.length > 0) {
        finalUserAnswers[currentQuestion] = [...selectedOptions];
      }
      
      const finalQuestionStatus = {...questionStatus};
      
      console.log("Before calculation - Last question status:", finalQuestionStatus[currentQuestion]);
      console.log("Before calculation - Last question answer:", finalUserAnswers[currentQuestion]);
      
      const results = calculateResults(questions, finalUserAnswers);
      
      if (currentUser) {
        const testResponse = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          testType: year ? "PYQ" : "Personalized",
          year: year || null,
          paperType: paperType || "General",
          totalMarks: results.totalMarks,
          scoredMarks: results.actualMarks,
          scaledMarks: results.scaledMarks,
          lossMarks: results.lossMarks,
          totalTime: timeSpent.reduce((a, b) => a + b, 0),
          questions: questions.map((q, index) => {
            // Get the final status for this question
            let status = finalQuestionStatus[index] || "notVisited";
            const userAnswer = finalUserAnswers[index];
            
            // For the current question, make sure the status reflects the answer
            if (index === currentQuestion && userAnswer) {
              if (Array.isArray(userAnswer) && userAnswer.length > 0) {
                status = markedForReview ? "attemptedReview" : "attempted";
              } else if (typeof userAnswer === "string" && userAnswer.trim() !== '') {
                status = markedForReview ? "attemptedReview" : "attempted";
              }
            }
            
            return {
              questionId: q.id,
              questionText: q.text,
              questionType: q.type,
              options: q.options || [],
              correctOption: q.correctOption || "",
              correctOptions: q.correctOptions || [],
              userAnswer: userAnswer || null,
              timeSpent: timeSpent[index] || 0,
              status: status,
              marks: q.marks,
              subject: q.subject,
            };
          }),
          subjectPerformance: results.subjectPerformance || [],
          weakSubjects: results.weakSubjects || [],
          timestamp: serverTimestamp(),
        };
        
        try {
          const docRef = await addDoc(collection(db, "testResponses"), testResponse);
          console.log("Test submission successful with ID:", docRef.id);
          
          sessionStorage.setItem('testResults', JSON.stringify({
            ...results,
            testResponseId: docRef.id,
            questions,
            userAnswers: finalUserAnswers,
            questionStatus: finalQuestionStatus,
            timeSpent,
            paperType
          }));
          
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

  const handleSkipQuestion = () => {
    updateQuestionStatus(markedForReview ? "skippedReview" : "skipped");
    
    if (currentQuestion < questions.length - 1) {
      moveToQuestion(currentQuestion + 1);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    const currentQuestionData = questions[currentQuestion];
    
    if (currentQuestionData.type === "MCQ") {
      setSelectedOption(optionId);
      // Immediately update the answer and status when selecting an MCQ option
      updateAnswer(optionId);
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    } else if (currentQuestionData.type === "MSQ") {
      const newSelectedOptions = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      
      setSelectedOptions(newSelectedOptions);
      
      // Immediately update the answer and status when selecting MSQ options
      if (newSelectedOptions.length > 0) {
        updateAnswer(newSelectedOptions);
        updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
      }
    }
  };

  return {
    submitting,
    currentQuestion,
    selectedOption,
    selectedOptions,
    markedForReview,
    setMarkedForReview,
    updateAnswer,
    handleOptionSelect,
    handleNextQuestion,
    handleSkipQuestion,
    handleJumpToQuestion,
    handleSubmitTest,
    saveCurrentQuestionAnswer,
    updateQuestionStatus
  };
};
