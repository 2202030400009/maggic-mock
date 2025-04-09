
import { useParams } from "react-router-dom";
import { usePaper } from "@/context/PaperContext";
import QuestionHeader from "@/components/test/QuestionHeader";
import QuestionPalette from "@/components/test/QuestionPalette";
import QuestionDisplay from "@/components/test/QuestionDisplay";
import QuestionControls from "@/components/test/QuestionControls";
import { useTestLoader } from "@/hooks/useTestLoader";
import { useTestControls } from "@/hooks/useTestControls";
import { useTestTimer } from "@/hooks/useTestTimer";
import { useFullscreenMonitor } from "@/hooks/useFullscreenMonitor";

const TestContainer = () => {
  const { year } = useParams<{ year: string }>();
  const { paperType } = usePaper();
  
  // Load test data
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
    setRemainingTime
  } = useTestLoader(year, paperType);

  // Test control functions
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
    saveCurrentQuestionAnswer,
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

  // Start timers
  useTestTimer({
    loading,
    remainingTime,
    setRemainingTime,
    currentQuestion,
    timeSpent,
    setTimeSpent,
    handleSubmitTest
  });
  
  // Monitor fullscreen state
  useFullscreenMonitor();

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
            updateQuestionStatus={updateQuestionStatus}
          />
          
          <QuestionControls 
            currentQuestion={currentQuestion}
            totalQuestions={questions.length}
            handleNextQuestion={handleNextQuestion}
            handleSkipQuestion={handleSkipQuestion}
            submitting={submitting}
            questionType={currentQuestionData.type}
          />
        </div>

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

export default TestContainer;
