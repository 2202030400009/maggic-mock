
import { cn } from "@/lib/utils";

export interface QuestionHeaderProps {
  paperType: string | null;
  year?: string;
  currentQuestion: number;
  totalQuestions: number;
  remainingTime: number;
}

const QuestionHeader = ({
  paperType,
  year,
  currentQuestion,
  totalQuestions,
  remainingTime,
}: QuestionHeaderProps) => {
  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">{paperType} {year || "Personalized Test"}</h1>
        <div className="flex space-x-4">
          <div className="bg-indigo-100 px-3 py-1 rounded text-sm font-medium">
            Question {currentQuestion + 1}/{totalQuestions}
          </div>
          <div className={cn(
            "px-3 py-1 rounded text-sm font-medium",
            remainingTime < 300 ? "bg-red-100 text-red-700" : "bg-red-100"
          )}>
            Time: {formatTime(remainingTime)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default QuestionHeader;
