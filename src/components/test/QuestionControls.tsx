
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface QuestionControlsProps {
  currentQuestion: number;
  totalQuestions: number;
  handleNextQuestion: () => void;
  handleSkipQuestion: () => void;
  submitting?: boolean;
}

const QuestionControls = ({
  currentQuestion,
  totalQuestions,
  handleNextQuestion,
  handleSkipQuestion,
  submitting = false,
}: QuestionControlsProps) => {
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  
  return (
    <div className="mt-8 flex justify-between">
      <Button variant="outline" onClick={handleSkipQuestion} disabled={submitting}>
        Skip
      </Button>
      
      <Button 
        onClick={handleNextQuestion} 
        className="bg-indigo-600 hover:bg-indigo-700"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            {isLastQuestion ? "Submitting..." : "Saving..."}
          </>
        ) : (
          <>
            {isLastQuestion ? "Submit Test" : "Save & Next"}
            {!isLastQuestion && <ArrowRight className="ml-1 h-4 w-4" />}
          </>
        )}
      </Button>
    </div>
  );
};

export default QuestionControls;
