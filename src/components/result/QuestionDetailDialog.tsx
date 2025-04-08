
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { QuestionDetail } from "@/types/result";

interface QuestionDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  question: QuestionDetail | null;
  getUserAnswerDisplay: (question: QuestionDetail) => string;
}

const QuestionDetailDialog = ({
  isOpen,
  onOpenChange,
  question,
  getUserAnswerDisplay
}: QuestionDetailDialogProps) => {
  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              Question Analysis
              <span className={`px-2 py-1 text-xs rounded-full ${
                question.isCorrect 
                  ? "bg-green-100 text-green-800" 
                  : (question.isSkipped 
                    ? "bg-orange-100 text-orange-800" 
                    : "bg-red-100 text-red-800")
              }`}>
                {question.isCorrect 
                  ? "Correct" 
                  : (question.isSkipped 
                    ? "Skipped" 
                    : "Incorrect")}
              </span>
            </div>
            <DialogClose>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {question.subject} • {question.type} • {question.marks} mark{question.marks !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-medium">Question</h3>
            <p className="mt-1">{question.text}</p>
          </div>
          
          {question.options && (question.type === "MCQ" || question.type === "MSQ") && (
            <div>
              <h3 className="font-medium mb-2">Options</h3>
              <div className="space-y-2">
                {question.options.map(option => (
                  <div key={option.id} className={`p-2 rounded ${
                    question.type === "MCQ" 
                      ? (option.id === question.correctOption 
                        ? "bg-green-50 border border-green-200" 
                        : (typeof question.userAnswer === "string" && option.id === question.userAnswer && option.id !== question.correctOption
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50 border border-gray-200"))
                      : (question.correctOptions?.includes(option.id)
                        ? "bg-green-50 border border-green-200"
                        : (Array.isArray(question.userAnswer) && question.userAnswer.includes(option.id) && !question.correctOptions?.includes(option.id)
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50 border border-gray-200"))
                  }`}>
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center mr-3">
                        {option.id.toUpperCase()}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {question.type === "NAT" && (
            <div>
              <h3 className="font-medium">Numerical Answer Range</h3>
              <p className="mt-1">{question.rangeStart} to {question.rangeEnd}</p>
              
              <h3 className="font-medium mt-3">Your Answer</h3>
              <p className="mt-1">{question.userAnswer || "Not answered"}</p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium">Your Answer:</span> {getUserAnswerDisplay(question)}
              </div>
              <div>
                <span className="font-medium">Marks:</span> {
                  question.isCorrect 
                    ? `+${question.marks}` 
                    : (question.isSkipped 
                        ? "0" 
                        : `-${question.negativeMark}`)
                }
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDetailDialog;
