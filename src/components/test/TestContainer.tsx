
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import QuestionDisplay from "./QuestionDisplay";
import QuestionControls from "./QuestionControls";
import QuestionPalette from "./QuestionPalette";
import QuestionHeader from "./QuestionHeader";
import { Question } from "@/lib/types";
import { usePaper } from "@/context/PaperContext";
import { useFullscreenMonitor } from "@/hooks/useFullscreenMonitor";
import { useTestLoader } from "@/hooks/useTestLoader";
import { useTestTimer } from "@/hooks/useTestTimer";
import { useTestControls } from "@/hooks/useTestControls";
import { useTestResults } from "@/hooks/useTestResults";

const TestContainer: React.FC = () => {
  const { year, testId } = useParams();
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const [testTypeDisplay, setTestTypeDisplay] = useState("");

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
  } = useTestLoader(year, paperType);

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
    if (remainingTime <= 0 && questions.length > 0) {
      toast({
        title: "Time's up!",
        description: "Your test has been automatically submitted.",
        variant: "destructive",
      });
      handleSubmitTest();
    }
  }, [remainingTime, questions.length, handleSubmitTest]);

  // Calculate test results
  const { calculateResults } = useTestResults();
  
  // If the test is still loading, show a loading message
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading Test...</h2>
          <p>Please wait while we prepare your test questions.</p>
        </div>
      </div>
    );
  }

  // If there was an error loading the test, show an error message
  if (error || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Test Error</h2>
          <p>{error || "No questions available for this test."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <QuestionHeader 
        paperType={paperType}
        year={year}
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        remainingTime={remainingTime}
      />

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main content with question display and controls */}
        <div className="lg:w-3/4 space-y-6">
          <QuestionDisplay
            currentQuestionData={questions[currentQuestion]}
            currentQuestion={currentQuestion}
            markedForReview={markedForReview}
            setMarkedForReview={setMarkedForReview}
            selectedOption={selectedOption}
            selectedOptions={selectedOptions}
            handleOptionSelect={handleOptionSelect}
            updateAnswer={updateAnswer}
            userAnswers={userAnswers}
            updateQuestionStatus={updateQuestionStatus}
          />

          <QuestionControls
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
            handleNextQuestion={handleNextQuestion}
            handleSkipQuestion={handleSkipQuestion}
            submitting={submitting}
            questionType={questions[currentQuestion]?.type}
          />
        </div>

        {/* Question palette */}
        <div className="lg:w-1/4">
          <QuestionPalette
            questionsCount={questions.length}
            questionStatus={questionStatus}
            currentQuestion={currentQuestion}
            onJumpToQuestion={handleJumpToQuestion}
          />
        </div>
      </div>
    </div>
  );
};

export default TestContainer;
