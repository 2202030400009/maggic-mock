
import React from "react";
import QuestionHeader from "./QuestionHeader";

interface TestHeaderProps {
  paperType: string | null;
  year: string | undefined;
  currentQuestion: number;
  totalQuestions: number;
  remainingTime: number;
}

const TestHeader: React.FC<TestHeaderProps> = ({
  paperType,
  year,
  currentQuestion,
  totalQuestions,
  remainingTime
}) => {
  return (
    <QuestionHeader 
      paperType={paperType}
      year={year}
      currentQuestion={currentQuestion}
      totalQuestions={totalQuestions}
      remainingTime={remainingTime}
    />
  );
};

export default TestHeader;
