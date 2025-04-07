
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Flag } from "lucide-react";

// Status colors for question palette
const statusColors = {
  notVisited: "bg-gray-200",
  attempted: "bg-green-500 text-white",
  skipped: "bg-red-500 text-white",
  attemptedReview: "bg-purple-500 text-white",
  skippedReview: "bg-orange-500 text-white"
};

interface QuestionPaletteProps {
  questionsCount: number;
  questionStatus: Record<number, string>;
  currentQuestion: number;
  onJumpToQuestion: (index: number) => void;
}

const QuestionPalette = ({
  questionsCount,
  questionStatus,
  currentQuestion,
  onJumpToQuestion,
}: QuestionPaletteProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attempted":
        return <CheckCircle className="h-3 w-3" />;
      case "skipped":
        return <XCircle className="h-3 w-3" />;
      case "attemptedReview":
      case "skippedReview":
        return <Flag className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-72 bg-white shadow-lg p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3">Question Palette</h3>
      
      <div className="mb-4 flex flex-wrap gap-1">
        {Array(questionsCount).fill(0).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-8 h-8 text-xs font-medium rounded flex items-center justify-center",
              statusColors[questionStatus[index] as keyof typeof statusColors] || statusColors.notVisited
            )}
            onClick={() => onJumpToQuestion(index)}
          >
            {index + 1}
            {getStatusIcon(questionStatus[index])}
          </button>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="text-xs font-medium mb-1">Legend:</div>
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(statusColors).map(([key, color]) => (
            <div key={key} className="flex items-center text-xs">
              <div className={cn("w-4 h-4 rounded mr-2", color)}></div>
              <span className="capitalize">
                {key === "notVisited" ? "Not Visited" : 
                 key === "attemptedReview" ? "Attempted & Marked" : 
                 key === "skippedReview" ? "Skipped & Marked" : 
                 key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
