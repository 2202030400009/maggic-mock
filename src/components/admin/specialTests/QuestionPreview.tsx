
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface QuestionPreviewProps {
  questionType: string;
  questionText: string;
  imageUrl: string;
  options?: string[];
  correctOption?: string;
  correctOptions?: string[];
  rangeStart?: string;
  rangeEnd?: string;
  subject: string;
  marks: string;
  negativeMark: number;
  onSave: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

const QuestionPreview: React.FC<QuestionPreviewProps> = ({
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
  onSave,
  onEdit,
  isSubmitting
}) => {
  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-2">
        <div className="text-sm text-gray-500">Question:</div>
        <p className="text-lg">{questionText}</p>
      </div>

      {imageUrl && (
        <div>
          <div className="text-sm text-gray-500 mb-2">Image:</div>
          <img 
            src={imageUrl} 
            alt="Question" 
            className="max-h-[200px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
            }}
          />
        </div>
      )}

      {(questionType === "MCQ" || questionType === "MSQ") && options && (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">Options:</div>
          {options.map((option, index) => (
            <div 
              key={index} 
              className={`p-3 border rounded-md ${
                questionType === "MCQ"
                  ? correctOption === String.fromCharCode(97 + index)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                  : correctOptions?.includes(String.fromCharCode(97 + index))
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
              }`}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-medium mr-3">
                  {String.fromCharCode(97 + index).toUpperCase()}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {questionType === "NAT" && (
        <div className="space-y-2">
          <div className="text-sm text-gray-500">Answer Range:</div>
          <p>
            {rangeStart} to {rangeEnd}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <div className="text-sm text-gray-500">Subject:</div>
          <p>{subject}</p>
        </div>
        <div>
          <div className="text-sm text-gray-500">Marks:</div>
          <p>{marks} ({negativeMark} negative marks)</p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onEdit} disabled={isSubmitting}>
          Edit
        </Button>
        <Button 
          type="button"
          onClick={onSave}
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          <Save className="mr-1 h-4 w-4" /> {isSubmitting ? "Adding..." : "Add Question"}
        </Button>
      </div>
    </div>
  );
};

export default QuestionPreview;
