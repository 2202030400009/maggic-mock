
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface QuestionControlsProps {
  currentQuestion: number;
  totalQuestions: number;
  handleNextQuestion: () => void;
  handleSkipQuestion: () => void;
}

const QuestionControls = ({
  currentQuestion,
  totalQuestions,
  handleNextQuestion,
  handleSkipQuestion,
}: QuestionControlsProps) => {
  return (
    <div className="mt-8 flex justify-between">
      <Button variant="outline" onClick={handleSkipQuestion}>
        Skip
      </Button>
      
      <Button onClick={handleNextQuestion} className="bg-indigo-600 hover:bg-indigo-700">
        {currentQuestion === totalQuestions - 1 ? "Submit Test" : "Save & Next"}
        {currentQuestion !== totalQuestions - 1 && <ArrowRight className="ml-1 h-4 w-4" />}
      </Button>
    </div>
  );
};

export default QuestionControls;
