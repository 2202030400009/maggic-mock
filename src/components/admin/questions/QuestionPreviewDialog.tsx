
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Save } from "lucide-react";

interface QuestionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionData: {
    questionType: string;
    questionText: string;
    imageUrl?: string;
    options?: string[];
    correctOption?: string;
    correctOptions?: string[];
    rangeStart?: string;
    rangeEnd?: string;
    subject: string;
    marks: string;
  };
  negativeMark: number;
  onSave: () => void;
  onEdit: () => void;
  isSubmitting: boolean;
}

const QuestionPreviewDialog: React.FC<QuestionPreviewDialogProps> = ({
  open,
  onOpenChange,
  questionData,
  negativeMark,
  onSave,
  onEdit,
  isSubmitting
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Question Preview</DialogTitle>
          <DialogDescription>
            Review the question before adding it to the test
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Question:</div>
            <p className="text-lg">{questionData.questionText}</p>
          </div>

          {/* Image */}
          {questionData.imageUrl && (
            <div>
              <div className="text-sm text-gray-500 mb-2">Image:</div>
              <img 
                src={questionData.imageUrl} 
                alt="Question" 
                className="max-h-[200px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://placehold.co/400x200/f5f5f5/cccccc?text=Invalid+Image+URL";
                }}
              />
            </div>
          )}

          {/* Options for MCQ and MSQ */}
          {(questionData.questionType === "MCQ" || questionData.questionType === "MSQ") && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Options:</div>
              {questionData.options?.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md ${
                    questionData.questionType === "MCQ"
                      ? questionData.correctOption === String.fromCharCode(97 + index)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                      : questionData.correctOptions?.includes(String.fromCharCode(97 + index))
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

          {/* NAT Range */}
          {questionData.questionType === "NAT" && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Answer Range:</div>
              <p>
                {questionData.rangeStart} to {questionData.rangeEnd}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <div className="text-sm text-gray-500">Subject:</div>
              <p>{questionData.subject}</p>
            </div>
            <div>
              <div className="text-sm text-gray-500">Marks:</div>
              <p>{questionData.marks} ({negativeMark} negative marks)</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onEdit} disabled={isSubmitting}>
            Edit
          </Button>
          <Button 
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="mr-1 h-4 w-4" /> Add Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionPreviewDialog;
