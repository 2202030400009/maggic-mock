
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Flag } from "lucide-react";
import { Question } from "@/lib/types";

interface QuestionDisplayProps {
  currentQuestionData: Question;
  currentQuestion: number;
  markedForReview: boolean;
  setMarkedForReview: (marked: boolean) => void;
  selectedOption: string | null;
  selectedOptions: string[];
  handleOptionSelect: (optionId: string) => void;
  updateAnswer: (answer: string | string[] | null) => void;
  userAnswers: (string | string[] | null)[];
}

const QuestionDisplay = ({
  currentQuestionData,
  currentQuestion,
  markedForReview,
  setMarkedForReview,
  selectedOption,
  selectedOptions,
  handleOptionSelect,
  updateAnswer,
  userAnswers,
}: QuestionDisplayProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {currentQuestion + 1} • {currentQuestionData.marks} mark{currentQuestionData.marks > 1 ? 's' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-xs",
            markedForReview && "bg-amber-50 border-amber-300 text-amber-700"
          )}
          onClick={() => setMarkedForReview(!markedForReview)}
        >
          <Flag className={cn("h-3 w-3 mr-1", markedForReview ? "text-amber-500" : "text-gray-400")} />
          {markedForReview ? "Marked for Review" : "Mark for Review"}
        </Button>
      </div>

      <h2 className="text-lg font-medium mb-6">{currentQuestionData.text}</h2>
      
      {currentQuestionData.imageUrl && (
        <div className="mb-6">
          <img 
            src={currentQuestionData.imageUrl} 
            alt="Question" 
            className="max-h-[300px] object-contain mx-auto"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Image+Not+Available";
            }}
          />
        </div>
      )}

      {currentQuestionData.type === "MCQ" && currentQuestionData.options && (
        <div className="space-y-3">
          {currentQuestionData.options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "border rounded-md p-3 cursor-pointer transition-colors",
                selectedOption === option.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full border flex items-center justify-center mr-3",
                  selectedOption === option.id 
                    ? "border-indigo-500 bg-indigo-500 text-white" 
                    : "border-gray-300"
                )}>
                  {option.id.toUpperCase()}
                </div>
                <span>{option.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentQuestionData.type === "MSQ" && currentQuestionData.options && (
        <div className="space-y-3">
          {currentQuestionData.options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "border rounded-md p-3 cursor-pointer transition-colors",
                selectedOptions.includes(option.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="flex items-center">
                <div className={cn(
                  "w-6 h-6 rounded border flex items-center justify-center mr-3",
                  selectedOptions.includes(option.id) 
                    ? "border-indigo-500 bg-indigo-50 text-indigo-500" 
                    : "border-gray-300"
                )}>
                  {selectedOptions.includes(option.id) && "✓"}
                </div>
                <span>{option.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentQuestionData.type === "NAT" && (
        <div className="my-6">
          <Input
            type="number"
            placeholder="Enter your answer"
            className="max-w-xs"
            value={
              typeof userAnswers[currentQuestion] === "string"
                ? userAnswers[currentQuestion] as string
                : ""
            }
            onChange={(e) => updateAnswer(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;
