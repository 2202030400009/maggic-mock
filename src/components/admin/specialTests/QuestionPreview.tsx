
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, Save, Edit, AlertTriangle } from "lucide-react";
import { isValidImageUrl } from "@/utils/imageUtils";

interface QuestionPreviewProps {
  questionType: string;
  questionText: string;
  imageUrl: string;
  options: string[];
  correctOption: string;
  correctOptions: string[];
  rangeStart: string;
  rangeEnd: string;
  subject: string;
  marks: string;
  negativeMark: number;
  difficultyLevel: number;
  onSave: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

const QuestionPreview = ({
  questionType,
  questionText,
  imageUrl,
  options,
  correctOption,
  correctOptions,
  rangeStart,
  rangeEnd,
  subject,
  marks,
  negativeMark,
  difficultyLevel,
  onSave,
  onEdit,
  isSubmitting
}: QuestionPreviewProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const renderOptions = () => {
    const validOptions = options.filter(opt => opt.trim() !== "");
    
    return validOptions.map((option, index) => {
      const optionId = String.fromCharCode(97 + index);
      const isCorrect = questionType === "MCQ" 
        ? correctOption === optionId 
        : correctOptions.includes(optionId);
      
      return (
        <div 
          key={index} 
          className={`p-3 border rounded-md ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}
        >
          <div className="flex items-start space-x-3">
            <span className="font-medium text-gray-700">
              {String.fromCharCode(65 + index)}.
            </span>
            <div className="flex-1">
              {isValidImageUrl(option) ? (
                <div>
                  <img 
                    src={option} 
                    alt={`Option ${String.fromCharCode(65 + index)}`}
                    className="max-w-full max-h-32 object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1 break-all">{option}</p>
                </div>
              ) : (
                <span dangerouslySetInnerHTML={{ __html: option }} />
              )}
            </div>
            {isCorrect && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Correct
              </Badge>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question Preview</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{questionType}</Badge>
              <Badge variant="outline">{marks} mark{parseInt(marks) > 1 ? 's' : ''}</Badge>
              <Badge variant="outline">{subject}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Difficulty Level */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Difficulty Level:</p>
            {renderStars(difficultyLevel)}
          </div>

          <Separator />

          {/* Negative marking warning */}
          {negativeMark > 0 && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <p>Incorrect answer will deduct {negativeMark} mark{negativeMark > 1 ? 's' : ''}</p>
            </div>
          )}

          {/* Question text */}
          <div>
            <p className="font-medium text-gray-800 mb-2">Question:</p>
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: questionText }}
            />
          </div>

          {/* Question image */}
          {imageUrl && isValidImageUrl(imageUrl) && (
            <div>
              <img 
                src={imageUrl} 
                alt="Question illustration" 
                className="max-w-full max-h-64 object-contain rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <Separator />

          {/* Options for MCQ/MSQ */}
          {(questionType === "MCQ" || questionType === "MSQ") && (
            <div>
              <p className="font-medium text-gray-800 mb-3">
                {questionType === "MCQ" ? "Options (Select one):" : "Options (Select all correct):"}
              </p>
              <div className="space-y-2">
                {renderOptions()}
              </div>
            </div>
          )}

          {/* Answer range for NAT */}
          {questionType === "NAT" && (
            <div>
              <p className="font-medium text-gray-800 mb-2">Correct Answer Range:</p>
              <p className="text-gray-700">
                {rangeStart} to {rangeEnd}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Question
        </Button>
        <Button onClick={onSave} disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionPreview;
