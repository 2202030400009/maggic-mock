
import React from "react";
import QuestionPalette from "./QuestionPalette";

interface TestPaletteProps {
  questionsCount: number;
  questionStatus: Record<number, string>;
  currentQuestion: number;
  onJumpToQuestion: (index: number) => void;
}

const TestPalette: React.FC<TestPaletteProps> = ({
  questionsCount,
  questionStatus,
  currentQuestion,
  onJumpToQuestion
}) => {
  return (
    <div className="lg:w-1/4">
      <QuestionPalette
        questionsCount={questionsCount}
        questionStatus={questionStatus}
        currentQuestion={currentQuestion}
        onJumpToQuestion={onJumpToQuestion}
      />
    </div>
  );
};

export default TestPalette;
