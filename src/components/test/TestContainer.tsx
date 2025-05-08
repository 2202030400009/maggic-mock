
import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { usePaper } from "@/context/PaperContext";
import { useFullscreenMonitor } from "@/hooks/useFullscreenMonitor";
import { useTestLoader } from "@/hooks/useTestLoader";
import { useTestTimer } from "@/hooks/useTestTimer";
import { useTestControls } from "@/hooks/useTestControls";
import { useTestResults } from "@/hooks/useTestResults";
import TestHeader from "./TestHeader";
import TestContent from "./TestContent";
import TestPalette from "./TestPalette";
import TestLoading from "./TestLoading";
import TestError from "./TestError";

const TestContainer: React.FC = () => {
  const { year, testId } = useParams();
  const navigate = useNavigate();
  const { paperType } = usePaper();
  // Add a ref to prevent multiple time-based submissions
  const timeSubmitRef = useRef(false);

  console.log("TestContainer rendered with params:", { year, testId, paperType });

  // Load questions using the useTestLoader hook
  const {
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
  } = useTestLoader(year, paperType, testId);

  // Initialize test controls
  const {
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
    updateQuestionStatus
  } = useTestControls({ 
    questions, 
    paperType, 
    year,
    userAnswers,
    setUserAnswers,
    questionStatus,
    setQuestionStatus
  });

  // Initialize test timer
  useTestTimer({
    loading,
    remainingTime,
    setRemainingTime,
    currentQuestion,
    timeSpent,
    setTimeSpent,
    handleSubmitTest
  });

  useFullscreenMonitor();

  // Submit test when time runs out
  useEffect(() => {
    if (remainingTime <= 0 && questions.length > 0 && !timeSubmitRef.current) {
      console.log("Time's up, submitting test");
      timeSubmitRef.current = true; // Prevent multiple submissions

      toast({
        title: "Time's up!",
        description: "Your test has been automatically submitted.",
        variant: "destructive",
      });

      handleSubmitTest();
    }
  }, [remainingTime, questions.length, handleSubmitTest]);

  // If the test is still loading, show a loading message
  if (loading) {
    return <TestLoading />;
  }

  // If there was an error loading the test, show an error message
  if (error || questions.length === 0) {
    return (
      <TestError 
        error={error || "No questions available for this test."} 
        onBackToDashboard={() => navigate("/dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TestHeader 
        paperType={paperType}
        year={year}
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        remainingTime={remainingTime}
      />

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <TestContent 
          currentQuestion={currentQuestion}
          questions={questions}
          markedForReview={markedForReview}
          setMarkedForReview={setMarkedForReview}
          selectedOption={selectedOption}
          selectedOptions={selectedOptions}
          userAnswers={userAnswers}
          handleOptionSelect={handleOptionSelect}
          updateAnswer={updateAnswer}
          handleNextQuestion={handleNextQuestion}
          handleSkipQuestion={handleSkipQuestion}
          submitting={submitting}
          updateQuestionStatus={updateQuestionStatus}
        />

        <TestPalette 
          questionsCount={questions.length}
          questionStatus={questionStatus}
          currentQuestion={currentQuestion}
          onJumpToQuestion={handleJumpToQuestion}
        />
      </div>
    </div>
  );
};

export default TestContainer;
