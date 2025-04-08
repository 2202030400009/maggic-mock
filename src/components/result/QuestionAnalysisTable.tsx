
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuestionDetail } from "@/types/result";
import { useState } from "react";
import QuestionDetailDialog from "./QuestionDetailDialog";

interface QuestionAnalysisTableProps {
  questionDetails: QuestionDetail[];
}

const QuestionAnalysisTable = ({ questionDetails }: QuestionAnalysisTableProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionDetail | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getRowColor = (question: QuestionDetail) => {
    if (question.isSkipped) return "bg-orange-50 hover:bg-orange-100";
    if (question.isCorrect) return "bg-green-50 hover:bg-green-100";
    // If answered but wrong and has negative marking
    if (!question.isCorrect && question.negativeMark > 0) return "bg-red-50 hover:bg-red-100";
    return "bg-orange-50 hover:bg-orange-100"; // For wrong but no negative marking
  };

  const getCorrectAnswerDisplay = (question: QuestionDetail) => {
    if (question.type === "MCQ" && question.correctOption) {
      const option = question.options?.find(o => o.id === question.correctOption);
      return `${question.correctOption.toUpperCase()}: ${option?.text || ""}`;
    } 
    else if (question.type === "MSQ" && question.correctOptions) {
      return question.correctOptions
        .map(id => {
          const option = question.options?.find(o => o.id === id);
          return `${id.toUpperCase()}: ${option?.text || ""}`;
        })
        .join(", ");
    }
    else if (question.type === "NAT") {
      return `${question.rangeStart} to ${question.rangeEnd}`;
    }
    return "-";
  };

  const getUserAnswerDisplay = (question: QuestionDetail) => {
    const { userAnswer, type } = question;
    
    if (!userAnswer) return "Skipped";
    
    if (type === "MCQ" && typeof userAnswer === "string") {
      const option = question.options?.find(o => o.id === userAnswer);
      return `${userAnswer.toUpperCase()}: ${option?.text || ""}`;
    } 
    else if (type === "MSQ" && Array.isArray(userAnswer)) {
      if (userAnswer.length === 0) return "None selected";
      return userAnswer
        .map(id => {
          const option = question.options?.find(o => o.id === id);
          return `${id.toUpperCase()}: ${option?.text || ""}`;
        })
        .join(", ");
    }
    else if (type === "NAT" && typeof userAnswer === "string") {
      return userAnswer;
    }
    return "-";
  };
  
  const openQuestionDialog = (question: QuestionDetail) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Question Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Marked Answer</TableHead>
                  <TableHead>Correct Answer</TableHead>
                  <TableHead>Scored</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionDetails.map((question, index) => (
                  <TableRow 
                    key={question.id} 
                    className={`cursor-pointer ${getRowColor(question)}`}
                    onClick={() => openQuestionDialog(question)}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{question.type}</TableCell>
                    <TableCell>{question.marks}</TableCell>
                    <TableCell>{getUserAnswerDisplay(question)}</TableCell>
                    <TableCell>{getCorrectAnswerDisplay(question)}</TableCell>
                    <TableCell>
                      {question.isCorrect 
                        ? question.marks 
                        : (question.isSkipped 
                          ? "0" 
                          : `-${question.negativeMark}`)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <QuestionDetailDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        question={selectedQuestion}
        getUserAnswerDisplay={getUserAnswerDisplay}
      />
    </>
  );
};

export default QuestionAnalysisTable;
