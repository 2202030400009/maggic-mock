
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
import { generateSpecialTest } from "@/services/testService";

const TestContainer: React.FC = () => {
  const { year, testId } = useParams();
  const navigate = useNavigate();
  const { paperType } = usePaper();
  const [testTypeDisplay, setTestTypeDisplay] = useState("");

  // Load questions from regular tests (PYQs)
  const {
    questions: regularQuestions,
    loading: regularLoading,
    userAnswers,
    setUserAnswers,
    timeSpent,
    setTimeSpent,
    questionStatus,
    setQuestionStatus,
    remainingTime,
    setRemainingTime,
    error: testLoadError
  } = useTestLoader(year, paperType);

  // Special test handling
  const [specialTestQuestions, setSpecialTestQuestions] = useState<Question[]>([]);
  const [specialTestLoading, setSpecialTestLoading] = useState(false);
  const [specialTestError, setSpecialTestError] = useState<string | null>(null);
  const [specialTestDuration, setSpecialTestDuration] = useState<number | null>(null);

  // Load special test data if testId is provided
  useEffect(() => {
    const loadSpecialTest = async () => {
      if (!testId) return;

      setSpecialTestLoading(true);
      try {
        const testParams = await generateSpecialTest(testId);
        
        if (!testParams || !testParams.questions || testParams.questions.length === 0) {
          setSpecialTestError("No questions found for this test");
          return;
        }
        
        setSpecialTestQuestions(testParams.questions);
        setSpecialTestDuration(testParams.duration);
        setTestTypeDisplay("Special Test");
      } catch (err) {
        console.error("Error loading special test:", err);
        setSpecialTestError("Failed to load special test");
      } finally {
        setSpecialTestLoading(false);
      }
    };
    
    if (testId) {
      loadSpecialTest();
    }
  }, [testId]);

  // Determine which questions to use
  const finalQuestions = testId ? specialTestQuestions : regularQuestions;
  const finalLoading = testId ? specialTestLoading : regularLoading;
  const finalError = testId ? specialTestError : testLoadError;
  
  // Set up test duration (in minutes)
  const testDuration = testId && specialTestDuration 
    ? specialTestDuration * 60 // Convert minutes to seconds
    : 180 * 60; // Default 3 hours in seconds

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
    questions: finalQuestions, 
    paperType, 
    year,
    userAnswers,
    setUserAnswers,
    questionStatus,
    setQuestionStatus
  });

  // Initialize test timer
  useTestTimer({
    loading: finalLoading,
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
    if (remainingTime <= 0 && finalQuestions.length > 0) {
      toast({
        title: "Time's up!",
        description: "Your test has been automatically submitted.",
        variant: "destructive",
      });
      handleSubmitTest();
    }
  }, [remainingTime, finalQuestions.length, handleSubmitTest]);

  // Calculate test results
  const { calculateResults } = useTestResults();
  
  // If the test is still loading, show a loading message
  if (finalLoading) {
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
  if (finalError || finalQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Test Error</h2>
          <p>{finalError || "No questions available for this test."}</p>
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
        totalQuestions={finalQuestions.length}
        remainingTime={remainingTime}
      />

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main content with question display and controls */}
        <div className="lg:w-3/4 space-y-6">
          <QuestionDisplay
            currentQuestionData={finalQuestions[currentQuestion]}
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
            totalQuestions={finalQuestions.length}
            handleNextQuestion={handleNextQuestion}
            handleSkipQuestion={handleSkipQuestion}
            submitting={submitting}
            questionType={finalQuestions[currentQuestion]?.type}
          />
        </div>

        {/* Question palette */}
        <div className="lg:w-1/4">
          <QuestionPalette
            questionsCount={finalQuestions.length}
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
