
import { useState, useEffect } from "react";
import { AlertTriangle, HelpCircle, Flag, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Option, Question } from "@/lib/types";

// Helper function to format MAT range
const formatRange = (start?: number, end?: number) => {
  if (start === undefined || end === undefined) return '';
  return `(${start} to ${end})`;
};

interface QuestionDisplayProps {
  currentQuestionData: Question;
  currentQuestion: number;
  markedForReview: boolean;
  setMarkedForReview: (value: boolean) => void;
  selectedOption: string | null;
  selectedOptions: string[];
  handleOptionSelect: (optionId: string) => void;
  updateAnswer: (answer: string | string[] | null) => void;
  userAnswers: (string | string[] | null)[];
  updateQuestionStatus?: (status: string) => void;
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
  updateQuestionStatus
}: QuestionDisplayProps) => {
  const [natAnswer, setNatAnswer] = useState<string>('');

  // Initialize NAT answer from userAnswers on question change
  useEffect(() => {
    const answer = userAnswers[currentQuestion];
    if (currentQuestionData.type === "NAT" && answer !== null && typeof answer === 'string') {
      setNatAnswer(answer);
    } else {
      setNatAnswer('');
    }
  }, [currentQuestion, currentQuestionData.type, userAnswers]);

  const handleNatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNatAnswer(value);
    updateAnswer(value);
    
    // Update status immediately for NAT when input changes
    if (updateQuestionStatus && value.trim() !== '') {
      updateQuestionStatus(markedForReview ? "attemptedReview" : "attempted");
    }
  };

  const handleReviewToggle = (checked: boolean) => {
    setMarkedForReview(checked);
    
    // Update question status when review toggle changes
    if (updateQuestionStatus) {
      // Determine if the question has an answer
      let hasAnswer = false;
      
      if (currentQuestionData.type === "MCQ") {
        hasAnswer = selectedOption !== null;
      } else if (currentQuestionData.type === "MSQ") {
        hasAnswer = selectedOptions.length > 0;
      } else if (currentQuestionData.type === "NAT") {
        hasAnswer = natAnswer.trim() !== '';
      }
      
      // Update with appropriate status
      if (hasAnswer) {
        updateQuestionStatus(checked ? "attemptedReview" : "attempted");
      } else {
        updateQuestionStatus(checked ? "skippedReview" : "skipped");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Question number and mark */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Question {currentQuestion + 1}</h3>
        <span className="bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm font-medium">
          {currentQuestionData.marks} mark{currentQuestionData.marks > 1 ? 's' : ''}
        </span>
      </div>

      {/* Display warning for negative marking */}
      {currentQuestionData.negativeMark > 0 && (
        <div className="flex items-center gap-2 text-amber-600 mb-4 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <p>
            Incorrect answer will deduct {currentQuestionData.negativeMark} mark
            {currentQuestionData.negativeMark > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Question text */}
      <div className="mb-6">
        <p className="text-gray-800" dangerouslySetInnerHTML={{ __html: currentQuestionData.text }} />
      </div>

      {/* Image if available */}
      {currentQuestionData.imageUrl && (
        <div className="mb-6">
          <img 
            src={currentQuestionData.imageUrl}
            alt="Question illustration"
            className="max-w-full h-auto rounded-md"
          />
        </div>
      )}

      <Separator className="my-4" />

      {/* Render options for MCQ */}
      {currentQuestionData.type === "MCQ" && currentQuestionData.options && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">Select one option:</p>
          {currentQuestionData.options.map((option: Option) => (
            <div
              key={option.id}
              className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                selectedOption === option.id
                  ? "bg-indigo-50 border-indigo-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="shrink-0 mr-3">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedOption === option.id
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedOption === option.id && (
                    <CheckCircle className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              <span
                className={`text-gray-700 ${
                  selectedOption === option.id ? "font-medium" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: option.text }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Render options for MSQ */}
      {currentQuestionData.type === "MSQ" && currentQuestionData.options && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">Select all correct options:</p>
          {currentQuestionData.options.map((option: Option) => (
            <div
              key={option.id}
              className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                selectedOptions.includes(option.id)
                  ? "bg-indigo-50 border-indigo-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="shrink-0 mr-3">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    selectedOptions.includes(option.id)
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedOptions.includes(option.id) && (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
              <span
                className={`text-gray-700 ${
                  selectedOptions.includes(option.id) ? "font-medium" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: option.text }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Render input for NAT */}
      {currentQuestionData.type === "NAT" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter a numerical value :
          </p>
          <div className="max-w-xs">
            <Input
              type="number"
              step="0.01"
              value={natAnswer}
              onChange={handleNatInputChange}
              className="border-gray-300 focus:border-indigo-500"
              placeholder="Enter your answer"
            />
          </div>
        </div>
      )}

      {/* Mark for review toggle */}
      <div className="mt-8 flex items-center space-x-2">
        <Switch
          id="review-mode"
          checked={markedForReview}
          onCheckedChange={handleReviewToggle}
        />
        <Label htmlFor="review-mode" className="flex items-center cursor-pointer">
          <Flag className="h-4 w-4 mr-2 text-orange-500" />
          Mark for review
        </Label>
      </div>
    </div>
  );
};

export default QuestionDisplay;
