
import React from "react";
import QuestionDisplay from "./QuestionDisplay";
import QuestionControls from "./QuestionControls";
import { Question } from "@/lib/types";

interface TestContentProps {
  currentQuestion: number;
  questions: Question[];
  markedForReview: boolean;
  setMarkedForReview: React.Dispatch<React.SetStateAction<boolean>>;
  selectedOption: string | null;
  selectedOptions: string[];
  userAnswers: (string | string[] | null)[];
  handleOptionSelect: (option: string) => void;
  updateAnswer: (answer: string | string[] | null) => void;
  handleNextQuestion: () => void;
  handleSkipQuestion: () => void;
  submitting: boolean;
  updateQuestionStatus: (status: string) => void;
}

const TestContent: React.FC<TestContentProps> = ({
  currentQuestion,
  questions,
  markedForReview,
  setMarkedForReview,
  selectedOption,
  selectedOptions,
  userAnswers,
  handleOptionSelect,
  updateAnswer,
  handleNextQuestion,
  handleSkipQuestion,
  submitting,
  updateQuestionStatus
}) => {
  return (
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
  );
};

export default TestContent;
