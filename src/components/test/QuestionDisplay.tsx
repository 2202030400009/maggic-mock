
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Flag } from "lucide-react";
import { Question, QuestionType } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  // Get question type badge color
  const getQuestionTypeBadge = (type: QuestionType) => {
    switch (type) {
      case "MCQ":
        return "bg-blue-100 text-blue-800";
      case "MSQ":
        return "bg-purple-100 text-purple-800";
      case "NAT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Question {currentQuestion + 1} • {currentQuestionData.marks} mark{currentQuestionData.marks > 1 ? 's' : ''}
          </span>
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getQuestionTypeBadge(currentQuestionData.type))}>
            {currentQuestionData.type}
          </span>
        </div>
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
          <RadioGroup 
            value={selectedOption || ""} 
            onValueChange={(value) => handleOptionSelect(value)}
            className="space-y-3"
          >
            {currentQuestionData.options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "border rounded-md p-3 transition-colors",
                  selectedOption === option.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center">
                  <RadioGroupItem value={option.id} id={`option-${option.id}`} className="mr-3" />
                  <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-3">
                        {option.id.toUpperCase()}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {currentQuestionData.type === "MSQ" && currentQuestionData.options && (
        <div className="space-y-3">
          {currentQuestionData.options.map((option) => (
            <div
              key={option.id}
              className={cn(
                "border rounded-md p-3 transition-colors",
                selectedOptions.includes(option.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center">
                <Checkbox 
                  id={`msq-option-${option.id}`}
                  checked={selectedOptions.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleOptionSelect(option.id);
                    } else {
                      handleOptionSelect(option.id);
                    }
                  }}
                  className="mr-3"
                />
                <Label htmlFor={`msq-option-${option.id}`} className="flex-grow cursor-pointer">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center mr-3">
                      {option.id.toUpperCase()}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </Label>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentQuestionData.type === "NAT" && (
        <div className="my-6">
          <Label htmlFor="nat-answer" className="block mb-2">Enter your numerical answer:</Label>
          <Input
            id="nat-answer"
            type="number"
            step="any"
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
