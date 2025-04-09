
import { useState, useEffect } from "react";
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
}

export const useTestControls = ({ questions, paperType, year }: UseTestControlsProps) => {
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
  const [userAnswers, setUserAnswers] = useState<(string | string[] | null)[]>([]);
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>({});
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [remainingTime, setRemainingTime] = useState<number>(10800); // Default 3 hours

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
  };

  const handleNextQuestion = () => {
    saveCurrentQuestionAnswer();
    
    if (currentQuestion === questions.length - 1) {
      handleSubmitTest();
    } else {
      setCurrentQuestion(prev => prev + 1);
      
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
    saveCurrentQuestionAnswer();
    
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
    
    setMarkedForReview(false);
  };

  const handleSubmitTest = async () => {
    try {
      if (submitting) return;
      setSubmitting(true);
      
      // Save the last question answer before submitting
      saveCurrentQuestionAnswer();
      
      // Ensure the question statuses are properly updated in state before calculating results
      // This is crucial for the last question
      const updatedUserAnswers = [...userAnswers];
      const currentQuestionData = questions[currentQuestion];
      
      if (currentQuestionData?.type === "MCQ" && selectedOption) {
        updatedUserAnswers[currentQuestion] = selectedOption;
      } else if (currentQuestionData?.type === "MSQ" && selectedOptions.length > 0) {
        updatedUserAnswers[currentQuestion] = [...selectedOptions];
      }
      
      const results = calculateResults(questions, updatedUserAnswers);
      
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
            // Determine the correct status for each question, especially the last one
            let status = questionStatus[index] || "notVisited";
            const userAnswer = updatedUserAnswers[index];
            
            // If this is the last question and it has an answer but the status doesn't reflect it
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
            userAnswers: updatedUserAnswers,
            questionStatus,
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
      setCurrentQuestion(prev => prev + 1);
      
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

  return {
    loading,
    setLoading,
    submitting,
    currentQuestion,
    selectedOption,
    selectedOptions,
    markedForReview,
    setMarkedForReview,
    userAnswers,
    questionStatus,
    timeSpent,
    setTimeSpent,
    remainingTime,
    setRemainingTime,
    updateAnswer,
    handleOptionSelect,
    handleNextQuestion,
    handleSkipQuestion,
    handleJumpToQuestion,
    handleSubmitTest,
    saveCurrentQuestionAnswer
  };
};
